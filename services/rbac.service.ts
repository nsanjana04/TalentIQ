import type { RoleSlug } from "@/constants/role-slugs";
import { AppError } from "@/lib/errors/app-error";
import { permissionEngine } from "@/lib/rbac/engine";
import { getFullMatrix } from "@/lib/rbac/permission-matrix";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  getPermissionModule,
  isValidPermission,
  type Permission,
} from "@/lib/rbac/permissions";
import {
  getRolePermissionScope,
  isPermissionInRoleScope,
} from "@/lib/rbac/role-scope";
import { permissionRepository } from "@/repositories/permission.repository";
import { roleRepository } from "@/repositories/role.repository";
import { auditService } from "./audit.service";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";

export const rbacService = {
  async resolveUserPermissions(userId: string, roleId: string, roleSlug: RoleSlug) {
    return permissionEngine.resolveForUser(userId, roleId, roleSlug);
  },

  async getAllPermissions() {
    const dbPermissions = await permissionRepository.findAll();
    if (dbPermissions.length > 0) return dbPermissions;

    return ALL_PERMISSIONS.map((key) => ({
      id: key,
      key,
      name: PERMISSION_LABELS[key],
      module: getPermissionModule(key),
      description: PERMISSION_LABELS[key],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  },

  async getAllRoles() {
    return roleRepository.findAll();
  },

  async getRoleWithPermissions(roleId: string) {
    const data = await permissionRepository.getRolePermissionMatrix(roleId);
    if (!data) throw new AppError("NOT_FOUND", "Role not found");

    const roleSlug = data.role.slug as RoleSlug;
    const scope = new Set(getRolePermissionScope(roleSlug));

    return {
      ...data,
      permissions: data.permissions.filter((permission) => scope.has(permission.key as Permission)),
    };
  },

  async getDefaultMatrix() {
    return getFullMatrix();
  },

  async toggleRolePermission(
    roleId: string,
    permissionId: string,
    enabled: boolean,
    actorId: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError("NOT_FOUND", "Role not found");

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) throw new AppError("NOT_FOUND", "Permission not found");
    if (!isPermissionInRoleScope(role.slug as RoleSlug, permission.key)) {
      throw new AppError(
        "FORBIDDEN",
        `Permission "${permission.key}" is outside the ${role.slug} role scope.`
      );
    }

    await permissionRepository.setRolePermission(roleId, permissionId, enabled);
    await permissionVersionService.bumpForRolePermissionChange();

    await auditService.log({
      action: enabled ? "UPDATE" : "DELETE",
      entityType: "RolePermission",
      entityId: roleId,
      actorId,
      metadata: { permissionId, enabled },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return this.getRoleWithPermissions(roleId);
  },

  async bulkToggleRolePermissions(
    roleId: string,
    toggles: { permissionId: string; enabled: boolean }[],
    actorId: string,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new AppError("NOT_FOUND", "Role not found");

    const roleSlug = role.slug as RoleSlug;
    const allPermissions = await permissionRepository.findAll();
    const permissionById = new Map(allPermissions.map((p) => [p.id, p]));

    for (const toggle of toggles) {
      const permission = permissionById.get(toggle.permissionId);
      if (!permission) throw new AppError("NOT_FOUND", "Permission not found");
      if (toggle.enabled && !isPermissionInRoleScope(roleSlug, permission.key)) {
        throw new AppError(
          "FORBIDDEN",
          `Permission "${permission.key}" is outside the ${roleSlug} role scope.`
        );
      }
    }

    await permissionRepository.bulkSetRolePermissions(roleId, toggles);
    await permissionVersionService.bumpForRolePermissionChange();

    await auditService.log({
      action: "UPDATE",
      entityType: "RolePermission",
      entityId: roleId,
      actorId,
      metadata: { toggleCount: toggles.length },
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    return this.getRoleWithPermissions(roleId);
  },
};

export function validatePermissionKeys(keys: string[]): Permission[] {
  return keys.filter(isValidPermission) as Permission[];
}
