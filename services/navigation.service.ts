import type { RoleSlug } from "@/constants/role-slugs";
import { Permission } from "@/lib/rbac/permissions";
import { canAny } from "@/lib/rbac/check";
import { resolveDashboardScope } from "@/lib/dashboard/scope";
import { dashboardRepository } from "@/repositories/dashboard.repository";
import { prisma } from "@/lib/db/prisma";

export type NavBadgeCounts = Record<string, number>;

export const navigationService = {
  async getBadgeCounts(
    userId: string,
    role: RoleSlug,
    permissions: Permission[],
    visibleItemIds: string[] = []
  ): Promise<NavBadgeCounts> {
    const badges: NavBadgeCounts = {};
    const scope = await resolveDashboardScope(userId, role);
    const allow = (id: string) => visibleItemIds.length === 0 || visibleItemIds.includes(id);

    if (
      allow("certificates") &&
      canAny(permissions, [
        Permission.CERTIFICATES_MANAGE,
        Permission.CERTIFICATES_VIEW,
        Permission.CERTIFICATES_SELF_VIEW,
      ])
    ) {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const userIds = scope.userFilter
        ? await dashboardRepository.resolveScopedUserIds(scope)
        : undefined;
      const expiringSoon = await prisma.certificate.count({
        where: {
          deletedAt: null,
          ...(userIds && { userId: { in: userIds } }),
          expiresAt: { gt: now, lte: in30Days },
        },
      });
      if (expiringSoon > 0) {
        badges.certificates = expiringSoon;
      }
    }

    if (allow("admin-audit") && canAny(permissions, [Permission.AUDITLOGS_VIEW])) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAuditCount = await prisma.auditLog.count({
        where: { createdAt: { gte: since } },
      });
      if (recentAuditCount > 0) {
        badges["admin-audit"] = recentAuditCount;
      }
    }

    return badges;
  },
};
