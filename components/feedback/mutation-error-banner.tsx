"use client";

import { X } from "lucide-react";
import { getErrorMessage, resolveErrorDisplay } from "@/lib/errors/error-message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MutationErrorBannerProps {
  error: unknown;
  action?: string;
  onDismiss?: () => void;
  className?: string;
}

export function MutationErrorBanner({
  error,
  action = "Save changes",
  onDismiss,
  className,
}: MutationErrorBannerProps) {
  if (!error) return null;

  const info = resolveErrorDisplay(error, { action });
  const message = getErrorMessage(error, { action });

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive",
        className
      )}
      role="alert"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{message}</p>
        {(info.code || info.endpoint) && (
          <p className="mt-1 font-mono text-xs text-destructive/70">
            {info.code}
            {info.status ? ` · ${info.status}` : ""}
            {info.endpoint ? ` · ${info.endpoint}` : ""}
          </p>
        )}
      </div>
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
