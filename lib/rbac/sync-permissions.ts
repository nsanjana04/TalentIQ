import { prisma } from "@/lib/db/prisma";
import { PERMISSION_MATRIX } from "@/lib/rbac/permission-matrix";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  getPermissionModule,
} from "@/lib/rbac/permissions";
import { getRolePermissionScope, getRoleScreenScope } from "@/lib/rbac/role-scope";
import { retireObsoletePermissions } from "@/lib/rbac/retire-permissions";
import { retireObsoleteRoles } from "@/lib/rbac/retire-roles";
import type { RoleSlug } from "@/constants/role-slugs";
import { canonicalRoleWhere } from "@/lib/rbac/canonical-roles";

const ROLES = [
  { slug: "EMPLOYEE", name: "Employee", description: "Individual contributor" },
  { slug: "MANAGER", name: "Manager", description: "Team and department manager" },
  { slug: "ADMIN", name: "Admin", description: "System administrator" },
] as const;

/** Idempotent sync of roles, permissions, and role-permission matrix. */
export async function syncRbacToDatabase(): Promise<{ permissions: number; rolePermissions: number }> {
  const roleMap = new Map<string, string>();

  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { slug: role.slug, name: role.name, description: role.description, isSystem: true },
    });
    roleMap.set(role.slug, record.id);
  }

  const permissionMap = new Map<string, string>();
  for (const key of ALL_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key },
      update: { name: PERMISSION_LABELS[key], module: getPermissionModule(key) },
      create: {
        key,
        name: PERMISSION_LABELS[key],
        module: getPermissionModule(key),
        description: PERMISSION_LABELS[key],
      },
    });
    permissionMap.set(key, record.id);
  }

  let rolePermissionCount = 0;
  for (const [roleSlug, permKeys] of Object.entries(PERMISSION_MATRIX)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;
    for (const permKey of permKeys) {
      const permissionId = permissionMap.get(permKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      rolePermissionCount++;
    }
  }

  await retireObsoletePermissions(prisma);
  await retireObsoleteRoles(prisma);
  await enforceRoleScopes();

  return { permissions: ALL_PERMISSIONS.length, rolePermissions: rolePermissionCount };
}

/** Remove permissions and screen access outside each role's product scope. */
export async function enforceRoleScopes(): Promise<void> {
  const roles = await prisma.role.findMany({
    where: canonicalRoleWhere,
    select: { id: true, slug: true },
  });

  for (const role of roles) {
    const roleSlug = role.slug as RoleSlug;
    const allowedPermissionKeys = new Set(getRolePermissionScope(roleSlug));
    const allowedScreenKeys = new Set(getRoleScreenScope(roleSlug));

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      include: { permission: true },
    });

    const outOfScopePermissionIds = rolePermissions
      .filter((row) => !allowedPermissionKeys.has(row.permission.key as (typeof ALL_PERMISSIONS)[number]))
      .map((row) => row.permissionId);

    if (outOfScopePermissionIds.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: outOfScopePermissionIds } },
      });
    }

    const screens = await prisma.screen.findMany({
      where: { isActive: true },
      select: { id: true, key: true },
    });

    for (const screen of screens) {
      if (allowedScreenKeys.has(screen.key)) continue;
      await prisma.roleScreenAccess.updateMany({
        where: { roleId: role.id, screenId: screen.id },
        data: {
          enabled: false,
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canManage: false,
        },
      });
    }
  }
}

export async function syncAdminRolePermissions(): Promise<void> {
  await syncFullPermissionsForRole("ADMIN");
}

async function syncFullPermissionsForRole(slug: RoleSlug): Promise<void> {
  const role = await prisma.role.findUnique({ where: { slug } });
  if (!role) return;

  for (const key of ALL_PERMISSIONS) {
    const permission = await prisma.permission.findUnique({ where: { key } });
    if (!permission) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }
}
