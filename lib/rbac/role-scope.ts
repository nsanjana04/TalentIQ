import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RoleSlugConst } from "@/constants/role-slugs";
import { CANONICAL_SCREEN_KEYS } from "@/lib/screens/canonical-screens";
import { DEFAULT_ROLE_SCREEN_KEYS } from "@/lib/screens/screen-definitions";
import { ALL_PERMISSIONS, Permission, type Permission as PermissionType } from "./permissions";
import { getDefaultPermissionsForRole } from "./permission-matrix";

/**
 * Permissions that may be assigned to a role in the RBAC matrix.
 * Admin sees the full catalog; Employee and Manager only see their product scope.
 */
export function getRolePermissionScope(roleSlug: RoleSlug): PermissionType[] {
  if (roleSlug === RoleSlugConst.ADMIN) {
    return [...ALL_PERMISSIONS];
  }
  return getDefaultPermissionsForRole(roleSlug);
}

/** Sidebar / screen-access keys configurable per role. */
export function getRoleScreenScope(roleSlug: RoleSlug): readonly string[] {
  const config = DEFAULT_ROLE_SCREEN_KEYS[roleSlug];
  if (config === "all") {
    return CANONICAL_SCREEN_KEYS;
  }
  return config;
}

export function isPermissionInRoleScope(roleSlug: RoleSlug, permissionKey: string): boolean {
  return getRolePermissionScope(roleSlug).includes(permissionKey as PermissionType);
}

export function isScreenInRoleScope(roleSlug: RoleSlug, screenKey: string): boolean {
  return getRoleScreenScope(roleSlug).includes(screenKey);
}

/** Permissions employees must never retain (admin / org management). */
export const EMPLOYEE_FORBIDDEN_PERMISSIONS: PermissionType[] = [
  Permission.USERS_VIEW,
  Permission.USERS_CREATE,
  Permission.USERS_UPDATE,
  Permission.USERS_DELETE,
  Permission.DEPARTMENTS_VIEW,
  Permission.DEPARTMENTS_MANAGE,
  Permission.ROLES_MANAGE,
  Permission.RBAC_MANAGE,
  Permission.PERMISSIONS_MANAGE,
  Permission.ANALYTICS_VIEW,
  Permission.ANALYTICS_EXECUTIVE_VIEW,
  Permission.REPORTS_VIEW,
  Permission.REPORTS_EXPORT,
  Permission.SETTINGS_VIEW,
  Permission.SETTINGS_MANAGE,
  Permission.SETTINGS_GENERAL_MANAGE,
  Permission.SETTINGS_SECURITY_MANAGE,
  Permission.SETTINGS_EMAIL_MANAGE,
  Permission.SETTINGS_NOTIFICATIONS_MANAGE,
  Permission.SETTINGS_APPEARANCE_MANAGE,
  Permission.SETTINGS_SYSTEM_MANAGE,
  Permission.INTEGRATIONS_MANAGE,
  Permission.AUDITLOGS_VIEW,
  Permission.COURSES_MANAGE,
  Permission.LEARNING_ASSIGN,
  Permission.LEARNING_TEAM_VIEW,
  ...[
    Permission.LEARNING_COURSES_VIEW,
    Permission.LEARNING_COURSES_MANAGE,
    Permission.LEARNING_ASSIGNMENTS_VIEW,
    Permission.LEARNING_ASSIGNMENTS_CREATE,
    Permission.LEARNING_ASSIGNMENTS_UPDATE,
    Permission.LEARNING_ASSIGNMENTS_CANCEL,
    Permission.LEARNING_PROGRESS_VIEW,
    Permission.LEARNING_REPORTS_EXPORT,
  ],
  Permission.ASSESSMENTS_MANAGE,
  Permission.ASSESSMENTS_GRADE,
  Permission.CERTIFICATES_VIEW,
  Permission.CERTIFICATES_MANAGE,
];

export function assertPermissionAllowedForRole(roleSlug: RoleSlug, permissionKey: string): void {
  if (!isPermissionInRoleScope(roleSlug, permissionKey)) {
    throw new Error(
      `Permission "${permissionKey}" is outside the ${roleSlug} role scope and cannot be assigned.`
    );
  }
}
