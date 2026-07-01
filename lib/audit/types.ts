import type { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}
