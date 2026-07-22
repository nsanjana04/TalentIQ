"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { getErrorMessage, resolveErrorDisplay } from "@/lib/errors/error-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApiErrorStateProps {
  error: unknown;
  title?: string;
  /** Shown when error message is generic */
  description?: string;
  action?: string;
  resource?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  className?: string;
}

export function ApiErrorState({
  error,
  title = "Unable to load data",
  description,
  action = "Load data",
  resource,
  onRetry,
  isRetrying,
  compact,
  className,
}: ApiErrorStateProps) {
  const info = resolveErrorDisplay(error, { action, resource });
  const message = getErrorMessage(error, { action, resource, fallback: description });

  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5",
        compact ? "p-4" : "p-8 text-center",
        className
      )}
      role="alert"
    >
      <div className={cn("flex gap-3", compact ? "items-start" : "flex-col items-center")}>
        <AlertCircle
          className={cn("shrink-0 text-destructive", compact ? "mt-0.5 h-4 w-4" : "h-8 w-8")}
        />
        <div className={cn(compact ? "min-w-0 flex-1 text-left" : "space-y-2")}>
          <p className={cn("font-medium text-destructive", compact ? "text-sm" : "text-base")}>
            {title}
          </p>
          <p className={cn("text-destructive/90", compact ? "mt-1 text-sm" : "text-sm")}>
            {message}
          </p>
          {(info.endpoint || info.code) && (
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              {info.code}
              {info.status ? ` · HTTP ${info.status}` : ""}
              {info.endpoint ? ` · ${info.endpoint}` : ""}
            </p>
          )}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className={cn(compact ? "mt-3" : "mt-4")}
              disabled={isRetrying}
              onClick={onRetry}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
              {isRetrying ? "Retrying…" : "Try again"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
