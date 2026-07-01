"use client";

import { Loader2 } from "lucide-react";
import type { MetricSummary } from "@/types/analytics-hub";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { CHART_COLORS, tooltipStyle as baseTooltip } from "@/lib/design/tokens";

export const CHART_PRIMARY = CHART_COLORS.primary;
export const CHART_SUCCESS = CHART_COLORS.success;
export const CHART_WARNING = CHART_COLORS.warning;
export const CHART_DANGER = CHART_COLORS.danger;
export const CHART_ACCENT = CHART_COLORS.accent;
export const CHART_MUTED = CHART_COLORS.muted;
export const tooltipStyle = baseTooltip;

export function AnalyticsLoader() {
  return (
    <div className="flex justify-center py-20 text-muted-foreground">
      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
      Loading analytics…
    </div>
  );
}

export function SummaryKpis({ summary, className }: { summary: MetricSummary[]; className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {summary.map((kpi) => (
        <Card key={kpi.label} className="border-primary/10">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-bold">
              {kpi.value}
              {kpi.unit && <span className="text-lg text-muted-foreground">{kpi.unit}</span>}
            </p>
            {kpi.changeLabel && (
              <p className="mt-1 text-xs text-muted-foreground">
                {kpi.change !== undefined && <span className="font-medium">{kpi.change} </span>}
                {kpi.changeLabel}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ScopeBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="font-normal">
      {label}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  developing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  not_ready: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace("_", " ");
  return (
    <Badge className={cn("capitalize", STATUS_STYLES[status] ?? "bg-muted")} variant="secondary">
      {label}
    </Badge>
  );
}
