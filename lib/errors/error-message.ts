import type { ErrorCode } from "./app-error";
import { isAppError } from "./app-error";
import { ApiClientError } from "./api-client-error";

const CODE_MESSAGES: Partial<Record<ErrorCode | string, string>> = {
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This action conflicts with existing data.",
  VALIDATION_ERROR: "Some fields are invalid. Please review and try again.",
  BAD_REQUEST: "The request could not be processed.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong on our side. Please try again later.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
  INVALID_RESPONSE:
    "The server returned an unexpected response. The API endpoint may be misconfigured.",
  HTTP_ERROR: "The request failed. Please try again.",
  PARSE_ERROR: "Could not read the server response.",
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "Bad request. Please check your input and try again.",
  401: "Authentication required. Please sign in again.",
  403: "You do not have permission to access this resource.",
  404: "The requested API endpoint or resource was not found.",
  409: "This action conflicts with existing data.",
  422: "Validation failed. Please correct the highlighted fields.",
  429: "Too many requests. Please slow down and try again.",
  500: "Server error. Please try again later.",
  502: "The server is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
};

export interface ErrorDisplayInfo {
  code: string;
  message: string;
  status: number | null;
  endpoint: string | null;
  details: unknown;
  isOperational: boolean;
}

function formatValidationDetails(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const record = details as Record<string, string[] | string | undefined>;
  const parts: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.length) {
      parts.push(`${field}: ${value.join(", ")}`);
    } else if (typeof value === "string" && value) {
      parts.push(`${field}: ${value}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

export function resolveErrorDisplay(
  error: unknown,
  context?: { action?: string; resource?: string }
): ErrorDisplayInfo {
  const actionPrefix = context?.action ? `${context.action}: ` : "";
  const resourceSuffix = context?.resource ? ` (${context.resource})` : "";

  if (error instanceof ApiClientError) {
    const validationHint = formatValidationDetails(error.details);
    const base =
      error.message ||
      CODE_MESSAGES[error.code] ||
      STATUS_MESSAGES[error.status] ||
      "Request failed.";
    return {
      code: error.code,
      message: validationHint ? `${base} ${validationHint}` : `${actionPrefix}${base}${resourceSuffix}`,
      status: error.status || null,
      endpoint: error.endpoint ?? null,
      details: error.details,
      isOperational: true,
    };
  }

  if (isAppError(error)) {
    return {
      code: error.code,
      message: `${actionPrefix}${error.message}${resourceSuffix}`,
      status: error.statusCode,
      endpoint: null,
      details: error.details,
      isOperational: true,
    };
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: `${actionPrefix}${CODE_MESSAGES.NETWORK_ERROR}${resourceSuffix}`,
      status: null,
      endpoint: null,
      details: undefined,
      isOperational: true,
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: `${actionPrefix}${error.message}${resourceSuffix}`,
      status: null,
      endpoint: null,
      details: undefined,
      isOperational: false,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: `${actionPrefix}An unexpected error occurred${resourceSuffix}.`,
    status: null,
    endpoint: null,
    details: error,
    isOperational: false,
  };
}

export function getErrorMessage(
  error: unknown,
  context?: { action?: string; resource?: string; fallback?: string }
): string {
  return resolveErrorDisplay(error, context).message || context?.fallback || "Something went wrong.";
}

export function getErrorCode(error: unknown): string {
  if (error instanceof ApiClientError) return error.code;
  if (isAppError(error)) return error.code;
  return "INTERNAL_ERROR";
}
