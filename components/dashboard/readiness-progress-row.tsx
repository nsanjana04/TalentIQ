"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReadinessProgressRowProps {
  label: string;
  ready: number;
  total: number;
  className?: string;
  indicatorClassName?: string;
}

/** Progress bar where fill = ready / total (e.g. succession 0/8 → empty bar). */
export function ReadinessProgressRow({
  label,
  ready,
  total,
  className,
  indicatorClassName,
}: ReadinessProgressRowProps) {
  const readyCount = Math.max(0, Number(ready) || 0);
  const totalCount = Math.max(0, Number(total) || 0);
  const pct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {readyCount}/{totalCount} ready ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-2" indicatorClassName={indicatorClassName} />
    </div>
  );
}
