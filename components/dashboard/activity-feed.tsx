"use client";

import {
  Award,
  BookOpen,
  ClipboardCheck,
  LogIn,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { ActivityItem } from "@/types/dashboard";
import { ChartCard } from "./chart-card";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  login: LogIn,
  skill: Sparkles,
  course: BookOpen,
  assessment: ClipboardCheck,
  certificate: Award,
  system: Wrench,
} as const;

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <ChartCard title="Recent Activity" description="Latest workforce events and updates">
      {items.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No recent activity"
          description="System events and notifications will appear here."
        />
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => {
            const Icon = ICON_MAP[item.icon];
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50",
                  i !== items.length - 1 && "border-b border-border/50"
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                  {item.actor && (
                    <p className="text-xs text-muted-foreground">by {item.actor}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
