import Link from "next/link";
import { ArrowRight, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type InsightSeverity = "critical" | "high" | "medium" | "low" | "info";

interface InsightCardProps {
  title: string;
  summary: string;
  severity: InsightSeverity;
  affectedUsers?: number;
  recommendedAction?: string;
  actionHref?: string;
  className?: string;
}

const SEVERITY_VARIANT: Record<InsightSeverity, "danger" | "warning" | "secondary" | "success" | "default"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "secondary",
  info: "default",
};

const SEVERITY_ICON = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: TrendingUp,
  low: Info,
  info: Info,
} as const;

export function InsightCard({
  title,
  summary,
  severity,
  affectedUsers,
  recommendedAction,
  actionHref,
  className,
}: InsightCardProps) {
  const Icon = SEVERITY_ICON[severity];

  return (
    <article
      className={cn(
        "enterprise-panel flex flex-col gap-3 p-4 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <Badge variant={SEVERITY_VARIANT[severity]}>{severity}</Badge>
        </div>
        {affectedUsers != null && (
          <span className="text-xs text-muted-foreground">{affectedUsers} affected</span>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      </div>
      {recommendedAction && (
        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground">{recommendedAction}</p>
          {actionHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={actionHref}>
                View
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
