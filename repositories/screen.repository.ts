import { prisma } from "@/lib/db/prisma";
import type { Permission } from "@/lib/rbac/permissions";
import { getEffectiveAccess } from "@/lib/rbac/get-effective-access";
import { canonicalActiveScreenWhere } from "@/lib/screens/canonical-screens";
import type { RoleScreenAccess, Screen, UserScreenOverride } from "@prisma/client";

export const screenRepository = {
  findAllActive(): Promise<Screen[]> {
    return prisma.screen.findMany({
      where: canonicalActiveScreenWhere,
      orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
    });
  },

  findAll(): Promise<Screen[]> {
    return prisma.screen.findMany({
      orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
    });
  },

  findByKey(key: string): Promise<Screen | null> {
    return prisma.screen.findUnique({ where: { key } });
  },

  findById(id: string): Promise<Screen | null> {
    return prisma.screen.findUnique({ where: { id } });
  },

  findByRoute(route: string): Promise<Screen | null> {
    return prisma.screen.findUnique({ where: { route } });
  },

  getRoleScreenAccess(roleId: string): Promise<RoleScreenAccess[]> {
    return prisma.roleScreenAccess.findMany({ where: { roleId } });
  },

  getRoleScreenAccessForRole(roleId: string, enabledOnly = false): Promise<RoleScreenAccess[]> {
    return prisma.roleScreenAccess.findMany({
      where: { roleId, ...(enabledOnly ? { enabled: true } : {}) },
    });
  },

  getUserOverrides(userId: string): Promise<UserScreenOverride[]> {
    return prisma.userScreenOverride.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  },

  findUserOverrideById(overrideId: string): Promise<UserScreenOverride | null> {
    return prisma.userScreenOverride.findUnique({ where: { id: overrideId } });
  },

  deleteUserOverrideById(overrideId: string): Promise<void> {
    return prisma.userScreenOverride.delete({ where: { id: overrideId } }).then(() => undefined);
  },

  upsertRoleScreenAccess(
    roleId: string,
    screenId: string,
    data: {
      enabled: boolean;
      canView: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      canManage: boolean;
    }
  ): Promise<RoleScreenAccess> {
    return prisma.roleScreenAccess.upsert({
      where: { roleId_screenId: { roleId, screenId } },
      update: data,
      create: { roleId, screenId, ...data },
    });
  },

  upsertUserOverride(
    userId: string,
    screenId: string,
    data: {
      overrideType: "ALLOW" | "DENY";
      enabled: boolean | null;
      reason?: string | null;
      expiresAt?: Date | null;
      createdById?: string | null;
    }
  ): Promise<UserScreenOverride> {
    return prisma.userScreenOverride.upsert({
      where: { userId_screenId: { userId, screenId } },
      update: data,
      create: { userId, screenId, ...data },
    });
  },

  deleteUserOverride(userId: string, screenId: string): Promise<void> {
    return prisma.userScreenOverride
      .delete({ where: { userId_screenId: { userId, screenId } } })
      .then(() => undefined);
  },

  createAudit(data: {
    actorId: string;
    targetRoleId?: string | null;
    targetUserId?: string | null;
    screenId: string;
    action: string;
    beforeJson?: string | null;
    afterJson?: string | null;
  }) {
    return prisma.screenAccessAudit.create({ data });
  },

  getRoleMatrix(roleId: string) {
    return prisma.screen.findMany({
      where: canonicalActiveScreenWhere,
      orderBy: [{ sectionOrder: "asc" }, { order: "asc" }],
      include: {
        roleScreenAccess: {
          where: { roleId },
          take: 1,
        },
      },
    });
  },

  countScreens(): Promise<number> {
    return prisma.screen.count();
  },

  getUserScreenOverridesForPermissions(userId: string) {
    return prisma.userScreenOverride.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        screen: { select: { id: true, requiredPermission: true } },
      },
    });
  },
};

export async function getUserScreenContext(userId: string): Promise<{
  roleId: string;
  roleSlug: string;
  permissions: Permission[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const effective = await getEffectiveAccess(userId);

  return {
    roleId: user.roleId,
    roleSlug: user.role.slug,
    permissions: effective.permissions,
  };
}
