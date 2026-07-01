import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { logError } from "@/lib/logger";
import { isAppError } from "./app-error";

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case "P2002":
      return apiError(
        "CONFLICT",
        "A record with this value already exists.",
        409,
        { fields: error.meta?.target }
      );
    case "P2025":
      return apiError("NOT_FOUND", "The requested record was not found.", 404);
    case "P2003":
      return apiError(
        "BAD_REQUEST",
        "This action references a related record that does not exist.",
        400
      );
    case "P2014":
      return apiError(
        "BAD_REQUEST",
        "This change would break a required relationship between records.",
        400
      );
    default:
      return null;
  }
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isAppError(error)) {
    return apiError(error.code, error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return apiError(
      "VALIDATION_ERROR",
      "Validation failed",
      422,
      error.flatten().fieldErrors
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaResponse = handlePrismaError(error);
    if (prismaResponse) return prismaResponse;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid data sent to the database.",
      422,
      process.env.NODE_ENV === "production" ? undefined : error.message
    );
  }

  if (error instanceof SyntaxError) {
    return apiError("BAD_REQUEST", "Invalid JSON in request body.", 400);
  }

  logError("API", error);

  return apiError(
    "INTERNAL_ERROR",
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred",
    500
  );
}
