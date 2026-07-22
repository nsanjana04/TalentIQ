"use client";

import { heatmapLevel } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

export interface HeatmapRow {
  id: string;
  label: string;
  values: { key: string; label: string; value: number }[];
}

interface HeatmapMatrixProps {
  rows: HeatmapRow[];
  title?: string;
  valueSuffix?: string;
  className?: string;
}

export function HeatmapMatrix({
  rows,
  title = "Skill readiness heatmap",
  valueSuffix = "%",
  className,
}: HeatmapMatrixProps) {
  if (rows.length === 0) {
    return (
      <div className={cn("enterprise-panel p-8 text-center text-sm text-muted-foreground", className)}>
        No heatmap data available
      </div>
    );
  }

  const columns = rows[0]?.values ?? [];

  return (
    <div className={cn("enterprise-panel overflow-hidden", className)}>
      <div className="border-b border-border/50 px-5 py-4">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[480px] border-collapse text-xs" role="grid">
          <thead>
            <tr>
              <th scope="col" className="px-2 py-2 text-left font-semibold text-muted-foreground">
                Department
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-2 py-2 text-center font-semibold text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border/40">
                <th scope="row" className="px-2 py-2 text-left font-medium text-foreground">
                  {row.label}
                </th>
                {row.values.map((cell) => {
                  const level = heatmapLevel(cell.value);
                  return (
                    <td key={cell.key} className="p-1">
                      <div
                        className={cn(
                          "flex h-10 items-center justify-center rounded-md font-semibold tabular-nums transition-transform hover:scale-105",
                          `heatmap-cell-${level}`
                        )}
                        title={`${row.label} · ${cell.label}: ${cell.value}${valueSuffix}`}
                        aria-label={`${row.label} ${cell.label} ${cell.value}${valueSuffix}`}
                      >
                        {cell.value}
                        {valueSuffix}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Low</span>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <div key={l} className={cn("h-3 w-6 rounded-sm", `heatmap-cell-${l as 0 | 1 | 2 | 3 | 4 | 5}`)} />
          ))}
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
