"use client";

import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingState } from "@/components/enterprise/states";
import { useMyCourseAssignments } from "@/hooks/use-learning-admin";
import { COURSE_LEVEL_TIER_LABELS } from "@/types/learning-admin";
import { ROUTES } from "@/constants/routes";

export function AssignedCoursesPanel() {
  const { data, isLoading } = useMyCourseAssignments();

  if (isLoading) return <LoadingState rows={3} />;

  if (!data?.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Assigned Courses</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((a) => (
          <div key={a.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{a.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {a.levelName} · {COURSE_LEVEL_TIER_LABELS[a.levelTier]}
                </p>
              </div>
              <Badge variant="outline">{a.status.replace(/_/g, " ")}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Due {new Date(a.dueDate).toLocaleDateString()}
            </p>
            <Progress value={a.progressPercent} className="mt-2 h-1.5" />
            <Button asChild size="sm" className="mt-3 gap-1" variant="outline">
              <Link href={ROUTES.coursePlayer(a.courseId)}>
                <PlayCircle className="h-3.5 w-3.5" />
                {a.progressPercent > 0 ? "Continue" : "Start"}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
