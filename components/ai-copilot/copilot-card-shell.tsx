"use client";

import type { AiResponseCard } from "@/types/employee-intelligence";
import type { InsightSeverity } from "@/types/ai-insights";
import { Badge } from "@/components/ui/badge";

const SEVERITY_VARIANT = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "secondary",
  info: "default",
} as const;

interface CopilotCardShellProps {
  card: AiResponseCard;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  children: React.ReactNode;
}

export function CopilotCardShell({ card, icon: Icon, accent, children }: CopilotCardShellProps) {
  return (
    <article className={`enterprise-panel space-y-4 border-l-4 p-4 ${accent}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={SEVERITY_VARIANT[card.severity as InsightSeverity]}>{card.severity}</Badge>
          <Badge variant="outline">{card.confidence}% confidence</Badge>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </article>
  );
}
