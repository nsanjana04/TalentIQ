"use client";

import { LoadingState } from "@/components/enterprise/states";
import { useDepartmentProgress, useLearningProgress, useOverdueAssignments } from "@/hooks/use-learning-admin";
import { Badge } from "@/components/ui/badge";

export function LearningProgressPanel() {
  const { data, isLoading } = useLearningProgress();
  if (isLoading) return <LoadingState rows={6} />;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[800px] text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Course</th>
            <th className="px-4 py-3">Level</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Due</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((r, i) => (
            <tr key={`${r.userId}-${i}`} className="border-t">
              <td className="px-4 py-3">{r.userName}</td>
              <td className="px-4 py-3">{r.courseTitle}</td>
              <td className="px-4 py-3">{r.levelName}</td>
              <td className="px-4 py-3"><Badge variant="outline">{r.status}</Badge></td>
              <td className="px-4 py-3">{r.progressPercent}%</td>
              <td className="px-4 py-3">{new Date(r.dueDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DepartmentProgressPanel() {
  const { data, isLoading } = useDepartmentProgress();
  if (isLoading) return <LoadingState rows={4} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data?.map((d) => (
        <div key={d.departmentId} className="rounded-lg border p-4">
          <p className="font-medium">{d.departmentName}</p>
          <p className="mt-2 text-2xl font-semibold">{d.completionRate}%</p>
          <p className="text-xs text-muted-foreground">
            {d.completed}/{d.totalAssignments} completed · {d.overdue} overdue
          </p>
        </div>
      ))}
    </div>
  );
}

export function OverdueAssignmentsPanel() {
  const { data, isLoading } = useOverdueAssignments();
  if (isLoading) return <LoadingState rows={4} />;
  const rows = (data ?? []) as {
    id: string;
    dueDate: string;
    status: string;
    user: { firstName: string; lastName: string; email: string; department?: { name: string } | null };
    course: { title: string };
    courseLevel: { name: string };
  }[];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
          <div>
            <p className="font-medium">{r.user.firstName} {r.user.lastName}</p>
            <p className="text-xs text-muted-foreground">{r.course.title} · {r.courseLevel.name}</p>
          </div>
          <Badge variant="danger">Due {new Date(r.dueDate).toLocaleDateString()}</Badge>
        </div>
      ))}
      {!rows.length && <p className="text-muted-foreground">No overdue assignments.</p>}
    </div>
  );
}
