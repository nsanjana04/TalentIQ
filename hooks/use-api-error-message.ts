"use client";

import { useMemo } from "react";
import { getErrorMessage, resolveErrorDisplay } from "@/lib/errors/error-message";

export function useApiErrorMessage(
  error: unknown,
  context?: { action?: string; resource?: string; fallback?: string }
) {
  return useMemo(() => {
    if (!error) return null;
    return getErrorMessage(error, context);
  }, [error, context?.action, context?.resource, context?.fallback]);
}

export function useApiErrorInfo(
  error: unknown,
  context?: { action?: string; resource?: string }
) {
  return useMemo(() => {
    if (!error) return null;
    return resolveErrorDisplay(error, context);
  }, [error, context?.action, context?.resource]);
}
