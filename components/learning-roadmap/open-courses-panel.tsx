"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Shield,
  Users,
  Package,
  BookOpen,
} from "lucide-react";
import {
  useCompleteOpenCourse,
  useOpenCourseSummary,
  useOpenCourses,
} from "@/hooks/use-learning-content";
import type { OpenCourseCategory } from "@/types/learning-content";
import { ResourceTypeBadge } from "@/components/learning-content/open-resource-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/routes";
import { OPEN_COURSE_CATEGORY_LABELS } from "@/lib/utils/learning-url";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<OpenCourseCategory, React.ComponentType<{ className?: string }>> = {
  PRODUCT: Package,
  HR_POLICIES: Users,
  SECURITY: Shield,
  GENERAL: BookOpen,
};

export function OpenCoursesPanel() {
  const [category, setCategory] = useState<OpenCourseCategory | "">("");

  const { data: summary } = useOpenCourseSummary();
  const { data: courses, isLoading } = useOpenCourses({
    category: category || undefined,
  });
  const complete = useCompleteOpenCourse();

  const mandatoryPending =
    summary && summary.mandatoryTotal > summary.mandatoryCompleted
      ? summary.mandatoryTotal - summary.mandatoryCompleted
      : 0;

  return (
    <div className="space-y-6">
      {summary && summary.total > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Company Training Library</h3>
                <p className="text-sm text-muted-foreground">
                  {summary.mandatoryCompleted}/{summary.mandatoryTotal} mandatory completed
                  {mandatoryPending > 0 && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      · {mandatoryPending} required remaining
                    </span>
                  )}
                </p>
              </div>
              <div className="min-w-[10rem]">
                <Progress
                  value={
                    summary.mandatoryTotal
                      ? Math.round((summary.mandatoryCompleted / summary.mandatoryTotal) * 100)
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={!category ? "default" : "outline"}
                onClick={() => setCategory("")}
              >
                All
              </Button>
              {(Object.keys(OPEN_COURSE_CATEGORY_LABELS) as OpenCourseCategory[]).map((cat) => {
                const stat = summary.byCategory.find((b) => b.category === cat);
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={category === cat ? "default" : "outline"}
                    className="gap-2"
                    onClick={() => setCategory(cat)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {OPEN_COURSE_CATEGORY_LABELS[cat]}
                    {stat && stat.total > 0 && (
                      <span className="text-xs opacity-70">
                        {stat.completed}/{stat.total}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading training library…
          </CardContent>
        </Card>
      ) : !courses?.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No open courses published yet. Your admin can add product, HR, security, and general training videos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {courses.map((course) => {
            const done = course.completionStatus === "COMPLETED";
            const required = (course.isMandatory || course.isAssigned) && !done;
            const Icon = CATEGORY_ICONS[course.category];
            return (
              <Card
                key={course.id}
                className={cn(
                  required && "border-amber-400/40",
                  done && "border-emerald-400/30"
                )}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      done ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                    )}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{course.title}</h4>
                        {required && (
                          <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            <AlertCircle className="h-3 w-3" />
                            {course.isAssigned && !course.isMandatory ? "Assigned" : "Required"}
                          </Badge>
                        )}
                        {done && (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{OPEN_COURSE_CATEGORY_LABELS[course.category]}</Badge>
                        <ResourceTypeBadge type={course.type} provider={course.provider} />
                      </div>
                      {course.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={ROUTES.openCoursePlayer(course.id)}>
                          <PlayCircle className="mr-1 h-4 w-4" />
                          {done ? "Review course" : "Start course"}
                        </Link>
                      </Button>
                      {course.completionStatus !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={complete.isPending}
                          onClick={() => complete.mutate(course.id)}
                        >
                          {complete.isPending ? "Saving…" : "Mark complete"}
                        </Button>
                      )}
                    </div>
                    {(course.isMandatory || course.isAssigned) &&
                      course.completionStatus !== "COMPLETED" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {course.isAssigned && !course.isMandatory
                          ? "This training was assigned to you. Watch the content, then mark it complete."
                          : "This training is mandatory. Watch the content, then mark it complete."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
