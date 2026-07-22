import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const notificationRepository = {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    return prisma.notification.create({ data });
  },

  async findForUser(userId: string, limit = 25) {
    return this.findByUser(userId, limit);
  },

  async findByUser(userId: string, limit = 25) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  },

  async findAdminUsers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        role: { slug: { in: ["ADMIN", "MANAGER"] } },
      },
      select: { id: true },
    });
  },
};
