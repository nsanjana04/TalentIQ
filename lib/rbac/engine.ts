import { resolveEffectivePermissions } from "./getEffectivePermissions";
import type { RoleSlug } from "@/constants/role-slugs";
import {
  isValidPermission,
  type Permission,
} from "./permissions";
import { can, canAny, canAll } from "./check";
import type { EffectivePermissions, PermissionCheckResult } from "./types";
import { permissionRepository } from "@/repositories/permission.repository";
import { screenRepository } from "@/repositories/screen.repository";

/**
 * Enterprise Permission Engine
 *
 * Resolves effective permissions by merging:
 * 1. Role permissions (from DB, fallback to matrix)
 * 2. User-level GRANT overrides
 * 3. User-level DENY overrides (DENY wins)
 * 4. User screen ALLOW/DENY overrides (grants screen requiredPermission only; DENY wins)
 */
export const permissionEngine = {
  async resolveForUser(userId: string, roleId: string, roleSlug: RoleSlug): Promise<EffectivePermissions> {
    const [rolePermissions, userOverrides, screenOverrides] = await Promise.all([
      permissionRepository.getPermissionsForRole(roleId),
      permissionRepository.getUserPermissionOverrides(userId),
      screenRepository.getUserScreenOverridesForPermissions(userId),
    ]);

    return resolveEffectivePermissions({
      userId,
      roleId,
      roleSlug,
      rolePermissions: rolePermissions.filter(isValidPermission),
      userOverrides: userOverrides.map((o) => ({
        permissionKey: o.permission.key,
        effect: o.effect,
      })),
      screenOverrides: screenOverrides.map((o) => ({
        overrideType: o.overrideType,
        requiredPermission: o.screen.requiredPermission,
        expiresAt: o.expiresAt,
      })),
    });
  },

  hasPermission(effective: EffectivePermissions, permission: Permission): boolean {
    return can(effective.permissions, permission);
  },

  hasAnyPermission(effective: EffectivePermissions, permissions: Permission[]): boolean {
    return canAny(effective.permissions, permissions);
  },

  hasAllPermissions(effective: EffectivePermissions, permissions: Permission[]): boolean {
    return canAll(effective.permissions, permissions);
  },

  check(effective: EffectivePermissions, permission: Permission): PermissionCheckResult {
    if (effective.denied.includes(permission)) {
      return { permission, granted: false, source: "user_deny" };
    }
    if (effective.permissions.includes(permission)) {
      const fromGrant = effective.granted.includes(permission);
      return {
        permission,
        granted: true,
        source: fromGrant ? "role" : "user_grant",
      };
    }
    return { permission, granted: false, source: "none" };
  },

  can,
  canAny,
  canAll,
};
