"use client";

import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ProgressRecord } from "@/types/course-admin";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function CourseProgressPanel({
  records,
  isLoading,
}: {
  records: ProgressRecord[] | undefined;
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading progress data…
      </div>
    );
  }

  if (!records?.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No progress data for this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((r) => {
        const isOpen = expanded === r.enrollmentId;
        return (
          <div key={r.enrollmentId} className="rounded-xl border bg-card/80">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : r.enrollmentId)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.userName}</p>
                <p className="text-xs text-muted-foreground">{r.userEmail}</p>
              </div>
              <div className="hidden min-w-[10rem] sm:block">
                <Progress value={r.courseProgress} className="h-1.5" />
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{r.courseProgress}%</p>
                <p className="text-xs text-muted-foreground">
                  {r.lessonsCompleted}/{r.totalLessons} lessons
                </p>
              </div>
            </button>

            {isOpen && (
              <div className="border-t px-4 pb-4 pt-2">
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Time spent: {r.timeSpentMinutes} min</span>
                  {r.lastActivityAt && (
                    <span>Last activity: {new Date(r.lastActivityAt).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {r.lessonBreakdown.map((l) => (
                    <div
                      key={l.lessonId}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div>
                        <span>{l.lessonTitle}</span>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {l.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-xs capitalize",
                            l.status === "COMPLETED" && "text-emerald-600",
                            l.status === "IN_PROGRESS" && "text-amber-600"
                          )}
                        >
                          {l.status.toLowerCase().replace("_", " ")}
                        </span>
                        <span className="w-8 text-right text-xs">{l.progressPercent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
