"use client";

import type { CellStatus, SkillMatrixData } from "@/types/skill-matrix";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<CellStatus, string> = {
  met: "bg-emerald-500/80 text-white",
  exceeds: "bg-blue-500/80 text-white",
  partial: "bg-amber-400/90 text-amber-950",
  missing: "bg-red-500/80 text-white",
  na: "bg-muted text-muted-foreground",
};

interface MatrixHeatmapProps {
  data: SkillMatrixData;
}

export function MatrixHeatmap({ data }: MatrixHeatmapProps) {
  if (data.rows.length === 0 || data.columns.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No matrix data for the selected filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-border/60">
      <table className="w-full min-w-[600px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[140px] border-b bg-card px-3 py-2 text-left font-medium">
              {data.view === "employee" || data.view === "heatmap" ? "Employee" : "Entity"}
            </th>
            {data.columns.map((col) => (
              <th
                key={col.id}
                className="border-b px-2 py-2 text-center font-medium text-muted-foreground"
                title={col.category}
              >
                <span className="block max-w-[72px] truncate">{col.name}</span>
              </th>
            ))}
            <th className="border-b px-2 py-2 text-center font-medium">Ready</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/20">
              <td className="sticky left-0 z-10 border-b bg-card px-3 py-2">
                <p className="font-medium">{row.name}</p>
                {row.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{row.subtitle}</p>
                )}
              </td>
              {data.columns.map((col) => {
                const cell = data.cells[row.id]?.[col.id];
                const status = cell?.status ?? "na";
                const label = cell?.actualLabel ?? (cell?.actualRank != null ? `L${cell.actualRank}` : "—");
                return (
                  <td key={col.id} className="border-b p-0.5">
                    <div
                      className={cn(
                        "flex h-8 min-w-[40px] items-center justify-center rounded-md text-[10px] font-medium",
                        STATUS_COLORS[status]
                      )}
                      title={
                        cell
                          ? `Actual: ${cell.actualLabel ?? "—"} · Required: ${cell.requiredLabel ?? "—"} · Score: ${cell.score}%`
                          : undefined
                      }
                    >
                      {label}
                    </div>
                  </td>
                );
              })}
              <td className="border-b px-2 py-2 text-center font-semibold">
                {row.readinessScore != null ? `${row.readinessScore}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
