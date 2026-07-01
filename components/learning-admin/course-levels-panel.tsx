"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/enterprise/states";
import { AssignCourseLevelButton } from "@/components/learning-admin/assign-course-level-button";
import { useAdminCourseLevels } from "@/hooks/use-learning-admin";
import { COURSE_LEVEL_TIER_LABELS } from "@/types/learning-admin";

export function CourseLevelsPanel({ courseId }: { courseId: string }) {
  const { data: levels, isLoading } = useAdminCourseLevels(courseId);

  if (isLoading) return <LoadingState rows={4} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {levels?.map((level) => (
        <Card key={level.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{level.name}</CardTitle>
              <Badge>{COURSE_LEVEL_TIER_LABELS[level.tier]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{level.description}</p>
            <p>Duration: {level.durationHours}h</p>
            <p>Passing score: {level.passingScore}%</p>
            <p>Certificate: {level.certificateEnabled ? "Yes" : "No"}</p>
            {level.unlockRule && <p className="text-xs">Unlock: {level.unlockRule.replace(/_/g, " ")}</p>}
            <AssignCourseLevelButton
              courseId={courseId}
              courseLevelId={level.id}
              label="Assign this level"
              variant="outline"
              className="mt-2"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
