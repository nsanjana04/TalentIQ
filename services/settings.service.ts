import type { SettingsCategory } from "@/types/settings";
import type { AuditLogsQuery, NotificationPreferencesInput, UpdateSettingsInput } from "@/lib/validations/settings";
import { SETTINGS_FIELD_DEFS } from "@/lib/settings/field-definitions";
import { settingsRepository } from "@/repositories/settings.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { auditService } from "@/services/audit.service";
import { rbacService } from "@/services/rbac.service";
import { prisma } from "@/lib/db/prisma";
import { canonicalRoleWhere, sortCanonicalRoles } from "@/lib/rbac/canonical-roles";
import type { AuditContext } from "@/lib/audit/types";

export const settingsService = {
  getOverview: () => settingsRepository.getOverview(true),

  getCategory: (category: SettingsCategory) => settingsRepository.getCategory(category, true),

  async updateCategory(
    category: SettingsCategory,
    input: UpdateSettingsInput,
    actorId: string,
    context: AuditContext
  ) {
    const allowedKeys = new Set(SETTINGS_FIELD_DEFS[category].fields.map((f) => f.key));
    const filtered = Object.fromEntries(
      Object.entries(input.settings).filter(([k]) => allowedKeys.has(k))
    );

    const result = await settingsRepository.updateSettings(filtered, actorId);

    await auditService.logWithContext("UPDATE", "SystemSetting", context, {
      entityId: category,
      metadata: { category, keys: result.updated },
    });

    return settingsRepository.getCategory(category, true);
  },

  getUserNotificationPrefs: (userId: string) =>
    settingsRepository.getUserNotificationPrefs(userId),

  async updateUserNotificationPrefs(userId: string, prefs: NotificationPreferencesInput) {
    return settingsRepository.updateUserNotificationPrefs(userId, prefs);
  },

  async getUserNotifications(userId: string, role?: import("@/constants/role-slugs").RoleSlug, permissions?: import("@/lib/rbac/permissions").Permission[]) {
    if (role && permissions) {
      const { notificationService } = await import("@/services/notification.service");
      const inbox = await notificationService.getInbox(userId, role, permissions);
      return { items: inbox.items, unread: inbox.unreadCount };
    }

    const [items, unread] = await Promise.all([
      notificationRepository.findByUser(userId),
      notificationRepository.countUnread(userId),
    ]);
    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        actionUrl: n.actionUrl,
        createdAt: n.createdAt.toISOString(),
      })),
      unread,
    };
  },

  markNotificationRead: (id: string, userId: string) =>
    notificationRepository.markRead(id, userId),

  markAllNotificationsRead: (userId: string) =>
    notificationRepository.markAllRead(userId),

  async getAuditLogs(query: AuditLogsQuery) {
    const result = await auditService.getLogs({
      ...(query.action && { action: query.action as import("@prisma/client").AuditAction }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.actorId && { actorId: query.actorId }),
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items: result.items.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : null,
        actorEmail: log.actor?.email ?? null,
        metadata: log.metadata as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  },

  async getRoleSummaries() {
    const roles = sortCanonicalRoles(
      await prisma.role.findMany({
        where: canonicalRoleWhere,
        include: {
          _count: {
            select: {
              rolePermissions: true,
              users: { where: { deletedAt: null, isActive: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      })
    );

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      isSystem: r.isSystem,
      permissionCount: r._count.rolePermissions,
      userCount: r._count.users,
    }));
  },

  getRoleWithPermissions: (roleId: string) => rbacService.getRoleWithPermissions(roleId),
};
