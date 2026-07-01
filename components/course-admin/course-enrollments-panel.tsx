"use client";

import { Loader2 } from "lucide-react";
import type { EnrollmentRecord } from "@/types/course-admin";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ENROLLED: "bg-primary/10 text-primary",
  IN_PROGRESS: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  DROPPED: "bg-muted text-muted-foreground",
};

export function CourseEnrollmentsPanel({
  enrollments,
  isLoading,
}: {
  enrollments: EnrollmentRecord[] | undefined;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading enrollments…
      </div>
    );
  }

  if (!enrollments?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No enrollments for this course yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Learner</th>
            <th className="px-4 py-3 font-medium">Department</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Lessons</th>
            <th className="px-4 py-3 font-medium">Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e) => (
            <tr key={e.id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium">{e.userName}</p>
                <p className="text-xs text-muted-foreground">{e.userEmail}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{e.department ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge className={cn("text-xs", STATUS_STYLES[e.status])}>
                  {e.status.replace("_", " ")}
                </Badge>
              </td>
              <td className="min-w-[8rem] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Progress value={e.progress} className="h-1.5 flex-1" />
                  <span className="text-xs">{e.progress}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {e.lessonsCompleted}/{e.totalLessons}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(e.enrolledAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
