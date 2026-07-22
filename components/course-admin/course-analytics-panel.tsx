"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { CourseAnalytics } from "@/types/course-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STATUS_COLORS: Record<string, string> = {
  ENROLLED: "hsl(var(--primary))",
  IN_PROGRESS: "hsl(45 90% 55%)",
  COMPLETED: "hsl(142 70% 45%)",
  DROPPED: "hsl(0 70% 55%)",
};

export function CourseAnalyticsPanel({
  analytics,
  isLoading,
}: {
  analytics: CourseAnalytics | undefined;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (!analytics) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Select a course to view analytics.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Enrollments</p>
            <p className="text-2xl font-bold">{analytics.totalEnrollments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Learners</p>
            <p className="text-2xl font-bold text-amber-600">{analytics.activeLearners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-emerald-600">{analytics.completedLearners}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Progress</p>
            <p className="text-2xl font-bold text-primary">{analytics.avgProgress}%</p>
            <Progress value={analytics.avgProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollments by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.enrollmentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.enrollmentsByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "hsl(var(--primary))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.progressTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="completions" stroke="hsl(142 70% 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lesson Completion Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.lessonCompletionRates.map((l) => (
              <div key={l.lessonId}>
                <div className="flex justify-between text-sm">
                  <span>
                    {l.lessonTitle}{" "}
                    <span className="text-muted-foreground">({l.type})</span>
                  </span>
                  <span className="font-medium">{l.completionRate}%</span>
                </div>
                <Progress value={l.completionRate} className="mt-1 h-1.5" />
              </div>
            ))}
            {analytics.lessonCompletionRates.length === 0 && (
              <p className="text-sm text-muted-foreground">No lessons in this course yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
