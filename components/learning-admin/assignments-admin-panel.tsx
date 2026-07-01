"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/enterprise/states";
import { useAdminAssignments, useAssignmentMutations } from "@/hooks/use-learning-admin";
import { ROUTES } from "@/constants/routes";

export function AssignmentsAdminPanel() {
  const { data, isLoading } = useAdminAssignments({ page: 1, pageSize: 50 });
  const { remind, cancel } = useAssignmentMutations();

  if (isLoading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild size="sm" className="gap-1">
          <Link href={ROUTES.ADMIN_LEARNING_ASSIGNMENTS_NEW}>
            <Plus className="h-4 w-4" />
            New Assignment
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 font-medium">{a.courseTitle}</td>
                <td className="px-4 py-3">{a.levelName}</td>
                <td className="px-4 py-3">
                  <p>{a.targetLabel}</p>
                  <p className="text-xs text-muted-foreground">{a.targetType}</p>
                </td>
                <td className="px-4 py-3">{new Date(a.dueDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{a.status}</Badge>
                </td>
                <td className="px-4 py-3">{a.progressPercent}%</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={ROUTES.adminLearningAssignment(a.id)} className="text-primary hover:underline">
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => remind.mutate(a.id)}
                    >
                      Remind
                    </button>
                    <button
                      type="button"
                      className="text-xs text-destructive hover:underline"
                      onClick={() => cancel.mutate(a.id)}
                    >
                      Cancel
                    </button>
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
