import type { RoleSlug } from "@/constants/role-slugs";
import { canAll, canAny } from "./check";
import type { Permission } from "./permissions";
import type { EffectivePermissions } from "./types";

export type AccessSource = "role" | "user_override" | "system" | "explicit_deny";

export interface CanAccessInput {
  permissions: Permission[];
  denied?: Permission[];
  role?: RoleSlug;
  requiredPermissions?: Permission[];
  permissionMode?: "any" | "all";
  allowedRoles?: RoleSlug[];
  disallowedRoles?: RoleSlug[];
  /** Personal routes (e.g. /account) — visible to all authenticated users. */
  isPersonal?: boolean;
}

export interface CanAccessResult {
  allowed: boolean;
  reason: string;
  missingPermissions: Permission[];
  deniedPermissions: Permission[];
  source: AccessSource;
}

export function canAccess(input: CanAccessInput): CanAccessResult {
  const {
    permissions,
    denied = [],
    role,
    requiredPermissions = [],
    permissionMode = "any",
    allowedRoles = [],
    disallowedRoles = [],
    isPersonal = false,
  } = input;

  if (isPersonal) {
    return {
      allowed: true,
      reason: "Personal route — all authenticated users",
      missingPermissions: [],
      deniedPermissions: [],
      source: "role",
    };
  }

  if (role && disallowedRoles.length > 0 && disallowedRoles.includes(role)) {
    return {
      allowed: false,
      reason: `Role ${role} is not permitted for this resource`,
      missingPermissions: requiredPermissions,
      deniedPermissions: [],
      source: "system",
    };
  }

  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return {
      allowed: false,
      reason: `Requires one of roles: ${allowedRoles.join(", ")}`,
      missingPermissions: requiredPermissions,
      deniedPermissions: [],
      source: "system",
    };
  }

  if (requiredPermissions.length === 0) {
    return {
      allowed: false,
      reason: "No permissions configured for this resource",
      missingPermissions: [],
      deniedPermissions: [],
      source: "system",
    };
  }

  const explicitlyDenied = requiredPermissions.filter((p) => denied.includes(p));
  if (explicitlyDenied.length > 0) {
    return {
      allowed: false,
      reason: "Access explicitly denied by administrator override",
      missingPermissions: requiredPermissions.filter((p) => !permissions.includes(p)),
      deniedPermissions: explicitlyDenied,
      source: "explicit_deny",
    };
  }

  const hasPermission =
    permissionMode === "all"
      ? canAll(permissions, requiredPermissions)
      : canAny(permissions, requiredPermissions);

  if (!hasPermission) {
    return {
      allowed: false,
      reason: "Missing required permissions",
      missingPermissions: requiredPermissions.filter((p) => !permissions.includes(p)),
      deniedPermissions: [],
      source: "role",
    };
  }

  return {
    allowed: true,
    reason: "Access granted",
    missingPermissions: [],
    deniedPermissions: [],
    source: permissions.some((p) => requiredPermissions.includes(p)) ? "role" : "user_override",
  };
}

export function canAccessFromEffective(
  effective: EffectivePermissions,
  requiredPermissions: Permission[],
  mode: "any" | "all" = "any",
  roleConstraints?: { allowedRoles?: RoleSlug[]; disallowedRoles?: RoleSlug[] }
): CanAccessResult {
  return canAccess({
    permissions: effective.permissions,
    denied: effective.denied,
    role: effective.roleSlug,
    requiredPermissions,
    permissionMode: mode,
    allowedRoles: roleConstraints?.allowedRoles,
    disallowedRoles: roleConstraints?.disallowedRoles,
  });
}
