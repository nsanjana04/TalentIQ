import type { AuditAction } from "@prisma/client";
import { logAuditToConsole } from "@/lib/audit/logger";
import type { AuditContext, AuditLogInput } from "@/lib/audit/types";
import { auditLogRepository } from "@/repositories/audit-log.repository";

export const auditService = {
  async log(input: AuditLogInput): Promise<void> {
    logAuditToConsole(input);

    try {
      await auditLogRepository.create(input);
    } catch (error) {
      console.error("[AuditService] Failed to persist audit log:", error);
    }
  },

  async logWithContext(
    action: AuditAction,
    entityType: string,
    context: AuditContext,
    options?: { entityId?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    await this.log({
      action,
      entityType,
      entityId: options?.entityId,
      actorId: context.actorId,
      metadata: options?.metadata,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async getLogs(params?: Parameters<typeof auditLogRepository.findMany>[0]) {
    return auditLogRepository.findMany(params);
  },
};
