"use client";

import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";
import type { AiRecommendation } from "@/types/dashboard";
import { ChartCard } from "./chart-card";
import { EmptyState } from "./empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT = {
  high: "danger",
  medium: "warning",
  low: "secondary",
} as const;

interface AiRecommendationsProps {
  recommendations: AiRecommendation[];
}

export function AiRecommendations({ recommendations }: AiRecommendationsProps) {
  const { canAccessRoute } = usePermissions();
  const canOpenCopilot = canAccessRoute(ROUTES.AI_COPILOT).enabled;

  return (
    <ChartCard
      title="AI Workforce Copilot Insights"
      description="Priority intelligence signals from live workforce data"
      action={
        canOpenCopilot ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.AI_COPILOT}>Open Copilot</Link>
          </Button>
        ) : undefined
      }
      className="min-w-0"
    >
      {recommendations.length === 0 ? (
        <div className="flex flex-col items-center py-8">
          <EmptyState
            icon={Bot}
            title="No priority signals"
            description="Open AI Workforce Copilot to query skill gaps, succession risks, and compliance signals from live records."
          />
          {canOpenCopilot && (
            <Button asChild size="sm" className="mt-2">
              <Link href={ROUTES.AI_COPILOT}>Ask the Copilot</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="group rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/20 p-4 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge variant={PRIORITY_VARIANT[rec.priority]}>
                  {rec.priority}
                </Badge>
                {rec.metric && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {rec.metric}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold leading-snug">{rec.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {rec.description}
              </p>
              {rec.action && (
                <button
                  type="button"
                  className={cn(
                    "mt-3 flex items-center gap-1 text-xs font-medium text-primary",
                    "opacity-0 transition-opacity group-hover:opacity-100"
                  )}
                >
                  {rec.action}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
