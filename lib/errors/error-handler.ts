import { AppError } from "./app-error";
import { logError as pinoLogError } from "@/lib/logger";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function logError(context: string, error: unknown): void {
  pinoLogError(context, error);

  if (process.env.NODE_ENV === "production" && !(error instanceof AppError)) {
    import("@sentry/nextjs")
      .then((Sentry) => {
        if (process.env.SENTRY_DSN) Sentry.captureException(error);
      })
      .catch(() => {});
  }
}
