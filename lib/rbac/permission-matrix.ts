import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RoleSlugConst } from "@/constants/role-slugs";
import { Permission, type Permission as PermissionType } from "./permissions";

/** Granular learning administration permissions (TalentIQ LMS). */
export const LEARNING_ADMIN_PERMISSIONS: PermissionType[] = [
  Permission.LEARNING_COURSES_VIEW,
  Permission.LEARNING_COURSES_MANAGE,
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.LEARNING_ASSIGNMENTS_UPDATE,
  Permission.LEARNING_ASSIGNMENTS_CANCEL,
  Permission.LEARNING_PROGRESS_VIEW,
  Permission.LEARNING_REPORTS_EXPORT,
];

/**
 * Default role → permission matrix (3 roles).
 * Used for seeding and as fallback when DB is unavailable.
 */
export const PERMISSION_MATRIX: Record<RoleSlug, PermissionType[]> = {
  [RoleSlugConst.EMPLOYEE]: [
    Permission.DASHBOARD_VIEW,
    Permission.COURSES_VIEW,
    Permission.LEARNING_ENROLL,
    Permission.ASSESSMENTS_TAKE,
    Permission.CERTIFICATES_SELF_VIEW,
  ],

  [RoleSlugConst.MANAGER]: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.DEPARTMENTS_VIEW,
    Permission.COURSES_VIEW,
    Permission.COURSES_MANAGE,
    Permission.LEARNING_ENROLL,
    Permission.LEARNING_ASSIGN,
    Permission.LEARNING_TEAM_VIEW,
    ...LEARNING_ADMIN_PERMISSIONS,
    Permission.ASSESSMENTS_TAKE,
    Permission.ASSESSMENTS_MANAGE,
    Permission.ASSESSMENTS_GRADE,
    Permission.CERTIFICATES_SELF_VIEW,
    Permission.CERTIFICATES_VIEW,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXECUTIVE_VIEW,
    Permission.REPORTS_VIEW,
    Permission.SETTINGS_VIEW,
  ],

  [RoleSlugConst.ADMIN]: [...Object.values(Permission)],
};

export function getDefaultPermissionsForRole(role: RoleSlug): PermissionType[] {
  return PERMISSION_MATRIX[role] ?? [];
}

export function getMatrixEntry(
  role: RoleSlug,
  permission: PermissionType
): boolean {
  return getDefaultPermissionsForRole(role).includes(permission);
}

export function getFullMatrix(): Record<RoleSlug, Record<PermissionType, boolean>> {
  const roles = Object.keys(PERMISSION_MATRIX) as RoleSlug[];
  const result = {} as Record<RoleSlug, Record<PermissionType, boolean>>;

  for (const role of roles) {
    const perms = getDefaultPermissionsForRole(role);
    result[role] = Object.values(Permission).reduce(
      (acc, p) => {
        acc[p] = perms.includes(p);
        return acc;
      },
      {} as Record<PermissionType, boolean>
    );
  }

  return result;
}
