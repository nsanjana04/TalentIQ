"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Film,
  Loader2,
  PlayCircle,
} from "lucide-react";
import {
  useCompleteOpenCourse,
  useOpenCoursePlayer,
} from "@/hooks/use-learning-content";
import { OpenCoursePlayerAdminBar } from "@/components/learning/open-course-player-admin-bar";
import type { OpenCourseCurriculumLesson } from "@/types/learning-content";
import {
  OpenResourceButton,
  PdfEmbed,
  ResourceTypeBadge,
  VideoEmbed,
  YouTubeEmbed,
} from "@/components/learning-content/open-resource-button";
import { resolveMediaPlayback } from "@/lib/utils/learning-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { OPEN_COURSE_CATEGORY_LABELS } from "@/lib/utils/learning-url";
import { cn } from "@/lib/utils";

type OpenCoursePlayerProps = {
  courseId: string;
};

type LessonTrailItem = OpenCourseCurriculumLesson & {
  moduleId: string;
  moduleTitle: string;
};

function truncateLabel(text: string, max = 36): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function OpenCoursePlayer({ courseId }: OpenCoursePlayerProps) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOpenCoursePlayer(courseId);
  const complete = useCompleteOpenCourse();

  const lessonTrail = useMemo((): LessonTrailItem[] => {
    if (!data) return [];
    return data.curriculum.modules.flatMap((module) =>
      module.lessons.map((lesson) => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
      }))
    );
  }, [data]);

  const currentLessonIndex = useMemo(
    () => lessonTrail.findIndex((lesson) => lesson.openCourseId === courseId),
    [lessonTrail, courseId]
  );

  const activeModule = useMemo(() => {
    if (!data) return null;
    return (
      data.curriculum.modules.find(
        (module) =>
          module.openCourseId === courseId ||
          module.lessons.some((lesson) => lesson.openCourseId === courseId)
      ) ?? null
    );
  }, [data, courseId]);

  const activeLesson = useMemo(
    () => lessonTrail.find((lesson) => lesson.openCourseId === courseId) ?? null,
    [lessonTrail, courseId]
  );

  const prevLesson = currentLessonIndex > 0 ? lessonTrail[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < lessonTrail.length - 1
      ? lessonTrail[currentLessonIndex + 1]
      : null;

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
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <p className="text-muted-foreground">Could not load this course.</p>
          <Button asChild variant="outline">
            <Link href={ROUTES.LEARNING_OPEN_COURSES}>Back to Learning Content</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { course, curriculum, canComplete, canManage } = data;
  const done = course.completionStatus === "COMPLETED";
  const progressPct = lessonTrail.length
    ? Math.round(((currentLessonIndex + 1) / lessonTrail.length) * 100)
    : 0;
  const moduleLessons = activeModule?.lessons ?? [];
  const playback = resolveMediaPlayback(course.type, course.url);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={ROUTES.LEARNING_OPEN_COURSES}>
            <ArrowLeft className="h-4 w-4" />
            Back to Learning Content
          </Link>
        </Button>
      </div>

      {canManage && (
        <OpenCoursePlayerAdminBar
          course={course}
          canMarkComplete={canComplete}
          isCompleted={done}
          onUpdated={() => refetch()}
        />
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="w-full shrink-0 border-0 shadow-sm ring-1 ring-border/60 lg:w-80">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">{curriculum.programTitle}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lesson {currentLessonIndex + 1} of {lessonTrail.length}
                </p>
              </div>
            </div>

            <Progress value={progressPct} className="h-2" />

            {activeModule && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current module
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug">{activeModule.title}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {moduleLessons.length === 1 ? "Current lesson" : "Lessons in this module"}
              </p>
              {moduleLessons.map((lesson) => {
                const isActiveLesson = lesson.openCourseId === courseId;
                const lessonDone = lesson.completionStatus === "COMPLETED";

                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm",
                      isActiveLesson
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 bg-muted/30"
                    )}
                  >
                    <Film className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                    {lessonDone && (
                      <CheckCircle2
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isActiveLesson ? "text-primary-foreground" : "text-emerald-600"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {(prevLesson || nextLesson) && (
              <div className="flex gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={!prevLesson}
                  onClick={() => {
                    if (prevLesson) router.push(ROUTES.openCoursePlayer(prevLesson.openCourseId));
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={!nextLesson}
                  onClick={() => {
                    if (nextLesson) router.push(ROUTES.openCoursePlayer(nextLesson.openCourseId));
                  }}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="min-w-0 flex-1 space-y-4">
          <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                      {activeLesson?.title ?? course.title}
                    </h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{OPEN_COURSE_CATEGORY_LABELS[course.category]}</Badge>
                    <ResourceTypeBadge type={course.type} provider={course.provider} />
                    {course.isMandatory && (
                      <Badge className="bg-amber-500/15 text-amber-700">Mandatory</Badge>
                    )}
                    {course.isPublished === false && (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                    {(course.assignmentCount ?? 0) > 0 && (
                      <Badge variant="outline">{course.assignmentCount} assigned</Badge>
                    )}
                    {done && (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Completed
                      </Badge>
                    )}
                  </div>
                  {course.description && (
                    <p className="max-w-3xl text-sm text-muted-foreground">{course.description}</p>
                  )}
                  {course.durationMinutes && (
                    <p className="text-xs text-muted-foreground">{course.durationMinutes} min</p>
                  )}
                </div>
              </div>

              {playback.kind === "youtube" && playback.embedUrl && (
                <YouTubeEmbed embedUrl={playback.embedUrl} title={course.title} />
              )}
              {playback.kind === "pdf" && playback.embedUrl && (
                <PdfEmbed
                  url={playback.embedUrl}
                  title={course.title}
                  backHref={ROUTES.LEARNING_OPEN_COURSES}
                />
              )}
              {playback.kind === "video" && playback.embedUrl && (
                <VideoEmbed
                  src={playback.embedUrl}
                  title={activeLesson?.title ?? course.title}
                  resetKey={courseId}
                />
              )}
              {playback.kind === "none" && (
                <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No inline preview is available for this lesson type. Use &quot;Open in new tab&quot; below.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <OpenResourceButton
                  navigation={course.navigation}
                  label={course.type === "YOUTUBE" ? "Open on YouTube" : "Open in new tab"}
                  variant="outline"
                />
                {canComplete && !done && !canManage && (
                  <Button
                    disabled={complete.isPending}
                    onClick={() => complete.mutate(course.id)}
                  >
                    {complete.isPending ? "Saving…" : "Mark as complete"}
                  </Button>
                )}
              </div>

              {(prevLesson || nextLesson) && (
                <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={!prevLesson}
                    onClick={() => {
                      if (prevLesson) router.push(ROUTES.openCoursePlayer(prevLesson.openCourseId));
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {prevLesson ? `Previous: ${truncateLabel(prevLesson.title)}` : "Previous lesson"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={!nextLesson}
                    onClick={() => {
                      if (nextLesson) router.push(ROUTES.openCoursePlayer(nextLesson.openCourseId));
                    }}
                  >
                    {nextLesson ? `Next: ${truncateLabel(nextLesson.title)}` : "Next lesson"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
