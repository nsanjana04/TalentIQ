"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnalyticsPanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  fullHeight?: boolean;
}

export function AnalyticsPanel({
  title,
  description,
  action,
  children,
  className,
  delay = 0,
  fullHeight,
}: AnalyticsPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "enterprise-panel flex flex-col overflow-hidden",
        fullHeight && "h-full",
        className
      )}
      aria-labelledby={`panel-${title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-4 border-b border-border/50 px-5 py-4 sm:flex-row">
        <div className="min-w-0">
          <h2
            id={`panel-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="text-sm font-semibold text-foreground"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </motion.section>
  );
}
