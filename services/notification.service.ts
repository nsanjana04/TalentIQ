import type { NotificationType } from "@prisma/client";
import type { RoleSlug } from "@/constants/role-slugs";
import { Permission } from "@/lib/rbac/permissions";
import { getNotificationEventBus } from "@/lib/notifications/event-bus";
import { notificationRepository } from "@/repositories/notification.repository";

export const notificationService = {
  async notify(params: {
    userId: string;
    type?: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    const record = await notificationRepository.create({
      userId: params.userId,
      type: params.type ?? "INFO",
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
    });

    getNotificationEventBus().publish(params.userId, {
      type: "notification",
      data: {
        id: record.id,
        title: record.title,
        message: record.message,
        notificationType: record.type,
        actionUrl: record.actionUrl,
        createdAt: record.createdAt.toISOString(),
      },
    });

    return record;
  },

  async notifyAdmins(params: { title: string; message: string; actionUrl?: string }) {
    const admins = await notificationRepository.findAdminUsers();
    await Promise.all(
      admins.map((a) =>
        this.notify({
          userId: a.id,
          type: "ACTION_REQUIRED",
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
        })
      )
    );
  },

  async getInbox(
    userId: string,
    _role: RoleSlug,
    _permissions: Permission[]
  ) {
    const rawItems = await notificationRepository.findByUser(userId);

    const items = rawItems.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    }));

    const unreadCount = items.filter((item) => !item.isRead).length;

    return { items, unreadCount };
  },

  async markRead(notificationId: string, userId: string) {
    await notificationRepository.markRead(notificationId, userId);
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  },
};
