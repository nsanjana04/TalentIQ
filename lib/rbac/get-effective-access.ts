import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "@/lib/rbac/permissions";
import { permissionEngine } from "@/lib/rbac/engine";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";
import { userRepository } from "@/repositories/user.repository";
import { canAny, canAll } from "@/lib/rbac/check";
import { getRoutePermissionRule } from "@/lib/rbac/routePermissions";
import { screenAccessService } from "@/services/screen-access.service";
import { ROUTES } from "@/constants/routes";
import { isPrivilegedEmergencyRole } from "@/lib/screens/emergency-screen-access";

export interface EffectiveAccess {
  userId: string;
  roleId: string;
  role: RoleSlug;
  permissions: Permission[];
  granted: Permission[];
  denied: Permission[];
  permissionVersion: number;
  userPermissionVersion: number;
}

/**
 * Single source of truth for user permissions (role + RBAC overrides + screen overrides).
 */
export async function getEffectiveAccess(userId: string): Promise<EffectiveAccess> {
  const user = await userRepository.findByIdWithRole(userId);
  if (!user?.role) {
    throw new Error("User not found");
  }

  const roleSlug = user.role.slug as RoleSlug;
  const [effective, versions] = await Promise.all([
    permissionEngine.resolveForUser(userId, user.roleId, roleSlug),
    permissionVersionService.getVersions(userId),
  ]);

  return {
    userId,
    roleId: effective.roleId,
    role: effective.roleSlug,
    permissions: effective.permissions,
    granted: effective.granted,
    denied: effective.denied,
    permissionVersion: versions.global,
    userPermissionVersion: versions.user,
  };
}

export async function canAccessPathWithEffectiveAccess(
  userId: string,
  pathname: string,
  access?: EffectiveAccess
): Promise<boolean> {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";

  if (normalized === ROUTES.ACCOUNT || normalized.startsWith(`${ROUTES.ACCOUNT}/`)) {
    return true;
  }

  const effective = access ?? (await getEffectiveAccess(userId));

  if (
    isPrivilegedEmergencyRole(effective.role) &&
    (normalized === ROUTES.DASHBOARD || normalized.startsWith(`${ROUTES.DASHBOARD}/`))
  ) {
    return true;
  }

  const screenResult = await screenAccessService.checkRouteAccess(
    userId,
    normalized,
    effective.permissions
  );

  if (screenResult.allowed) {
    return true;
  }

  if (screenResult.reason === "denied" || screenResult.reason === "inactive") {
    return false;
  }

  const routeAllowed = isPathAllowedByRoutePermissions(normalized, effective.permissions);
  if (routeAllowed) {
    return true;
  }

  if (screenResult.reason === "forbidden") {
    return false;
  }

  // No registered screen — allow when no route rule is defined.
  const rule = getRoutePermissionRule(normalized);
  return !rule || rule.permissions.length === 0;
}

export function isPathAllowedByRoutePermissions(
  pathname: string,
  permissions: Permission[]
): boolean {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const rule = getRoutePermissionRule(normalized);
  if (!rule || rule.permissions.length === 0) {
    return false;
  }

  return rule.mode === "all"
    ? canAll(permissions, rule.permissions)
    : canAny(permissions, rule.permissions);
}
