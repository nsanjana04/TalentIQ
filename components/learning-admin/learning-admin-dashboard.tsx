"use client";

import { BookOpen, ClipboardList, Clock, GraduationCap, TrendingUp } from "lucide-react";
import { ExecutiveMetricCard } from "@/components/enterprise/executive-metric-card";
import { LoadingState } from "@/components/enterprise/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignCourseLevelButton } from "@/components/learning-admin/assign-course-level-button";
import { useLearningAdminDashboard } from "@/hooks/use-learning-admin";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export function LearningAdminDashboardPanel() {
  const { data, isLoading } = useLearningAdminDashboard();

  if (isLoading) return <LoadingState rows={4} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Assign a course level</p>
          <p className="text-xs text-muted-foreground">
            Course + Level + Audience + Due Date — e.g. Cyber Security Fundamentals + Basic + Engineering Department
          </p>
        </div>
        <AssignCourseLevelButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ExecutiveMetricCard label="Total Courses" value={String(data.totalCourses)} icon={BookOpen} />
        <ExecutiveMetricCard label="Total Assignments" value={String(data.totalAssignments)} icon={ClipboardList} />
        <ExecutiveMetricCard label="Completion Rate" value={`${data.completionRate}%`} icon={TrendingUp} />
        <ExecutiveMetricCard label="Overdue" value={String(data.overdueAssignments)} icon={Clock} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Courses by Level</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.coursesByLevel.map((row) => (
              <div key={row.level} className="flex justify-between text-sm">
                <span>{row.level}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignments by Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.assignmentsByAudience.map((row) => (
              <div key={row.targetType} className="flex justify-between text-sm">
                <span>{row.targetType}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Assignments</CardTitle>
          <Link href={ROUTES.ADMIN_LEARNING_ASSIGNMENTS} className="text-xs text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentAssignments.map((a) => (
            <Link
              key={a.id}
              href={ROUTES.adminLearningAssignment(a.id)}
              className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">{a.courseTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {a.levelName} · {a.targetLabel}
                </p>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
