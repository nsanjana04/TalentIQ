"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/enterprise/states";
import { useAdminAssignmentDetail, useAssignmentMutations } from "@/hooks/use-learning-admin";

export function AssignmentDetailPanel({ id }: { id: string }) {
  const { data, isLoading } = useAdminAssignmentDetail(id);
  const { remind, cancel } = useAssignmentMutations();

  if (isLoading) return <LoadingState rows={4} />;
  if (!data) return <p className="text-muted-foreground">Assignment not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{data.courseTitle} — {data.levelName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Target:</span> {data.targetLabel}</p>
          <p><span className="text-muted-foreground">Type:</span> {data.targetType}</p>
          <p><span className="text-muted-foreground">Assigned by:</span> {data.assignedByName}</p>
          <p><span className="text-muted-foreground">Due:</span> {new Date(data.dueDate).toLocaleDateString()}</p>
          <p><span className="text-muted-foreground">Progress:</span> {data.progressPercent}%</p>
          <p><Badge variant="outline">{data.status}</Badge></p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => remind.mutate(id)}>Send reminder</Button>
        <Button size="sm" variant="destructive" onClick={() => cancel.mutate(id)}>Cancel assignment</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Due</th>
            </tr>
          </thead>
          <tbody>
            {data.userAssignments.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.userName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">{u.departmentName ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline">{u.status}</Badge></td>
                <td className="px-4 py-3">{u.progressPercent}%</td>
                <td className="px-4 py-3">{new Date(u.dueDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
