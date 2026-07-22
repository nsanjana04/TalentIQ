import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { AuditLogInput } from "@/lib/audit/types";

export const auditLogRepository = {
  async create(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  },

  async findMany(params?: {
    actorId?: string;
    action?: AuditAction;
    entityType?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...(params?.actorId && { actorId: params.actorId }),
          ...(params?.action && { action: params.action }),
          ...(params?.entityType && { entityType: params.entityType }),
        },
        include: {
          actor: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({
        where: {
          ...(params?.actorId && { actorId: params.actorId }),
          ...(params?.action && { action: params.action }),
          ...(params?.entityType && { entityType: params.entityType }),
        },
      }),
    ]);

    return { items, total, limit, offset };
  },
};
