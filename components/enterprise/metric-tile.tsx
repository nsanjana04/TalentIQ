"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricStatus = "neutral" | "success" | "warning" | "danger";

interface MetricTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  status?: MetricStatus;
  sparkline?: number[];
  className?: string;
  delay?: number;
}

const statusGlow: Record<MetricStatus, string> = {
  neutral: "",
  success: "metric-glow-success",
  warning: "metric-glow-warning",
  danger: "metric-glow-danger",
};

const statusIcon: Record<MetricStatus, string> = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
};

export function MetricTile({
  label,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  status = "neutral",
  sparkline,
  className,
  delay = 0,
}: MetricTileProps) {
  const isPositive = change != null && change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "enterprise-panel group relative min-w-0 overflow-hidden p-5 transition-shadow hover:shadow-md",
        statusGlow[status],
        className
      )}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change != null && changeLabel && (
            <div className="flex items-center gap-1 pt-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-hidden />
              )}
              <span className={isPositive ? "font-medium text-success" : "font-medium text-destructive"}>
                {change > 0 ? "+" : ""}
                {change}
              </span>
              <span className="text-muted-foreground">{changeLabel}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            statusIcon[status]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className="mt-4 flex h-8 items-end gap-0.5" aria-hidden>
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/20 transition-colors group-hover:bg-primary/30"
              style={{ height: `${Math.max(12, (v / Math.max(...sparkline)) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
