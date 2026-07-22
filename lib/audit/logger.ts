import type { AuditLogInput } from "./types";

export function formatAuditEntry(input: AuditLogInput) {
  return {
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actorId: input.actorId ?? null,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    timestamp: new Date().toISOString(),
  };
}

export function logAuditToConsole(input: AuditLogInput): void {
  if (process.env.NODE_ENV === "test") return;

  const entry = formatAuditEntry(input);
  console.info("[AUDIT]", JSON.stringify(entry));
}
