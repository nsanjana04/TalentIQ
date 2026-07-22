"use client";

import type { EmployeeIntelSnapshot } from "@/types/employee-intelligence";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/enterprise/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface EmployeeComparisonViewProps {
  employees: EmployeeIntelSnapshot[];
  className?: string;
}

export function EmployeeComparisonView({ employees, className }: EmployeeComparisonViewProps) {
  const columns = useMemo<ColumnDef<EmployeeIntelSnapshot>[]>(
    () => [
      { accessorKey: "employeeName", header: "Employee" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "department", header: "Department", cell: ({ row }) => row.original.department ?? "—" },
      {
        accessorKey: "readinessScore",
        header: "Readiness",
        cell: ({ row }) => `${row.original.readinessScore}%`,
      },
      {
        accessorKey: "riskScore",
        header: "Risk",
        cell: ({ row }) => `${row.original.riskScore}%`,
      },
      {
        accessorKey: "learningProgress",
        header: "Learning",
        cell: ({ row }) => `${row.original.learningProgress}%`,
      },
      {
        accessorKey: "promotionScore",
        header: "Promotion",
        cell: ({ row }) => (
          <Badge variant={row.original.promotionStatus === "ready" ? "success" : "secondary"}>
            {row.original.promotionScore}%
          </Badge>
        ),
      },
      {
        id: "skills",
        header: "Top skills",
        cell: ({ row }) =>
          row.original.skillScores
            .slice(0, 3)
            .map((s) => `${s.skillName} ${s.score}%`)
            .join(", ") || "—",
      },
    ],
    []
  );

  return (
    <div className={className}>
      <h3 className="mb-3 font-semibold">Employee comparison</h3>
      <DataTable columns={columns} data={employees} />

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((e) => (
          <div key={e.employeeId} className="enterprise-panel space-y-3 p-4">
            <div>
              <p className="font-semibold">{e.employeeName}</p>
              <p className="text-xs text-muted-foreground">{e.role}</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Readiness</span>
                <span>{e.readinessScore}%</span>
              </div>
              <Progress value={e.readinessScore} className="h-1.5" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium">AI recommendations</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {e.recommendations.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
