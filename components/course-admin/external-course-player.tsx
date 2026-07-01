"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, GraduationCap, Loader2 } from "lucide-react";
import { useCourseDetail } from "@/hooks/use-course-admin";
import {
  getExternalCourseConfig,
  getExternalCourseNavigation,
  isExternalCourse,
} from "@/constants/external-courses";
import {
  OpenResourceButton,
  ResourceTypeBadge,
} from "@/components/learning-content/open-resource-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

type ExternalCoursePlayerProps = {
  courseId: string;
};

export function ExternalCoursePlayer({ courseId }: ExternalCoursePlayerProps) {
  const { data: course, isLoading, isError } = useCourseDetail(courseId);

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

  if (isError || !course || !isExternalCourse(course.slug)) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <p className="text-muted-foreground">Could not load this external course.</p>
          <Button asChild variant="outline">
            <Link href={ROUTES.COURSES}>Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const externalConfig = getExternalCourseConfig(course.slug);
  const navigation = getExternalCourseNavigation(course.slug);

  if (!externalConfig || !navigation) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <p className="text-muted-foreground">External course link is not configured.</p>
          <Button asChild variant="outline">
            <Link href={ROUTES.COURSES}>Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href={ROUTES.COURSES}>
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{course.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-violet-400/40 text-violet-700 dark:text-violet-300">
                  Free on Udemy
                </Badge>
                <ResourceTypeBadge type={externalConfig.type ?? "UDEMY"} provider={externalConfig.provider} />
              </div>
              {(course.description || externalConfig.provider) && (
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {course.description ??
                    `Complete this free ${externalConfig.provider} course in your browser, then track progress in TalentIQ.`}
                </p>
              )}
              {course.durationMinutes && (
                <p className="text-xs text-muted-foreground">{course.durationMinutes} min estimated</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-dashed bg-muted/30 p-6 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              This course is hosted on {externalConfig.provider}. Open it in a new browser tab to watch
              lessons and complete exercises — the same experience as Open Courses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <OpenResourceButton
              navigation={navigation}
              label={`Open on ${externalConfig.provider ?? "Udemy"}`}
              size="default"
            />
            <Button asChild variant="outline">
              <a href={navigation.href} target="_blank" rel="noopener noreferrer">
                Continue in browser
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
