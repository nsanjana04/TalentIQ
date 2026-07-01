import type { UserPermissionEffect } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Permission } from "@/lib/rbac/permissions";

export const permissionRepository = {
  async findAll() {
    return prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ module: "asc" }, { key: "asc" }],
    });
  },

  async findByKey(key: string) {
    return prisma.permission.findUnique({ where: { key } });
  },

  async findById(id: string) {
    return prisma.permission.findUnique({ where: { id } });
  },

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const records = await prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: { deletedAt: null },
      },
      include: { permission: true },
    });

    return records.map((r) => r.permission.key as Permission);
  },

  async getUserPermissionOverrides(userId: string) {
    return prisma.userPermission.findMany({
      where: { userId, deletedAt: null },
      include: { permission: true },
    });
  },

  async getRolePermissionMatrix(roleId: string) {
    const [role, allPermissions, rolePermissions] = await Promise.all([
      prisma.role.findUnique({ where: { id: roleId } }),
      this.findAll(),
      prisma.rolePermission.findMany({
        where: { roleId },
        select: { permissionId: true },
      }),
    ]);

    if (!role) return null;

    const enabledIds = new Set(rolePermissions.map((rp) => rp.permissionId));

    return {
      role,
      permissions: allPermissions.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        module: p.module,
        enabled: enabledIds.has(p.id),
      })),
    };
  },

  async setRolePermission(
    roleId: string,
    permissionId: string,
    enabled: boolean
  ) {
    if (enabled) {
      return prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }

    return prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  },

  async setUserPermission(
    userId: string,
    permissionId: string,
    effect: UserPermissionEffect | null
  ) {
    if (!effect) {
      return prisma.userPermission.updateMany({
        where: { userId, permissionId },
        data: { deletedAt: new Date() },
      });
    }

    return prisma.userPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId },
      },
      update: { effect, deletedAt: null },
      create: { userId, permissionId, effect },
    });
  },

  async bulkSetRolePermissions(
    roleId: string,
    toggles: { permissionId: string; enabled: boolean }[]
  ) {
    const toEnable = toggles.filter((t) => t.enabled).map((t) => t.permissionId);
    const toDisable = toggles.filter((t) => !t.enabled).map((t) => t.permissionId);

    await prisma.$transaction([
      ...toEnable.map((permissionId) =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        })
      ),
      ...(toDisable.length > 0
        ? [
            prisma.rolePermission.deleteMany({
              where: { roleId, permissionId: { in: toDisable } },
            }),
          ]
        : []),
    ]);
  },
};
