"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/enterprise/states";
import { AssignCourseLevelButton } from "@/components/learning-admin/assign-course-level-button";
import { AssignmentPolicyBanner } from "@/components/learning-admin/assignment-policy-banner";
import { useAdminLearningCourses } from "@/hooks/use-learning-admin";
import { ROUTES } from "@/constants/routes";

export function CoursesAdminPanel() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminLearningCourses({ search, page: 1, pageSize: 50 });

  if (isLoading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-4">
      <AssignmentPolicyBanner compact />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search courses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AssignCourseLevelButton label="Assign course level" />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Levels</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((course) => (
              <tr key={course.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{course.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{course.description}</p>
                </td>
                <td className="px-4 py-3">{course.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={course.adminStatus === "ACTIVE" ? "default" : "secondary"}>
                    {course.adminStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {course.durationMinutes ? `~${Math.round(course.durationMinutes / 60)}h` : "—"}
                </td>
                <td className="px-4 py-3">{course.levelCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`${ROUTES.ADMIN_LEARNING_COURSES}/${course.id}/levels`}
                      className="text-primary hover:underline"
                    >
                      View levels
                    </Link>
                    <AssignCourseLevelButton
                      courseId={course.id}
                      label="Assign"
                      variant="outline"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
