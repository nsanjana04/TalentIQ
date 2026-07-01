import type { RoleSlug } from "@/constants/role-slugs";
import {
  ALL_PERMISSIONS,
  isValidPermission,
  type Permission,
} from "./permissions";
import { getDefaultPermissionsForRole } from "./permission-matrix";
import type { EffectivePermissions } from "./types";
import {
  applyScreenOverridePermissions,
  type ScreenPermissionOverrideInput,
} from "./screen-override-permissions";

export interface PermissionOverride {
  permissionKey: string;
  effect: "GRANT" | "DENY";
}

export interface ResolveEffectivePermissionsInput {
  userId: string;
  roleId: string;
  roleSlug: RoleSlug;
  rolePermissions?: Permission[];
  userOverrides?: PermissionOverride[];
  screenOverrides?: ScreenPermissionOverrideInput[];
}

/**
 * Pure permission resolver — merges role permissions, user GRANT overrides,
 * and user DENY overrides (explicit deny always wins).
 */
export function resolveEffectivePermissions(
  input: ResolveEffectivePermissionsInput
): EffectivePermissions {
  const rolePerms =
    input.rolePermissions && input.rolePermissions.length > 0
      ? input.rolePermissions.filter(isValidPermission)
      : getDefaultPermissionsForRole(input.roleSlug);

  const grantedSet = new Set<Permission>(rolePerms);
  const denied: Permission[] = [];
  const grantSources = new Map<Permission, "role" | "user_override" | "screen_override">();

  for (const p of rolePerms) {
    grantSources.set(p, "role");
  }

  for (const override of input.userOverrides ?? []) {
    if (!isValidPermission(override.permissionKey)) continue;

    if (override.effect === "GRANT") {
      grantedSet.add(override.permissionKey);
      grantSources.set(override.permissionKey, "user_override");
    } else {
      grantedSet.delete(override.permissionKey);
      denied.push(override.permissionKey);
      grantSources.delete(override.permissionKey);
    }
  }

  applyScreenOverridePermissions(
    grantedSet,
    denied,
    grantSources,
    input.screenOverrides ?? []
  );

  const deniedSet = new Set(denied);
  const permissions = ALL_PERMISSIONS.filter((p) => grantedSet.has(p) && !deniedSet.has(p));

  return {
    userId: input.userId,
    roleSlug: input.roleSlug,
    roleId: input.roleId,
    permissions,
    granted: [...grantedSet],
    denied,
    grantSources,
  };
}
