import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  enabled: !isTest,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }),
  base: {
    service: "talentiq",
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
    ],
    censor: "[REDACTED]",
  },
});

export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const err =
    error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : { message: String(error) };

  logger.error({ context, err, ...extra }, `${context} failed`);
}

export function logRequest(
  method: string,
  path: string,
  meta?: { status?: number; durationMs?: number; ip?: string }
) {
  logger.info({ method, path, ...meta }, "request");
}
