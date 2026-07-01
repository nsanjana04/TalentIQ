import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RoleSlugConst } from "@/constants/role-slugs";
import { Permission, type Permission as PermissionType } from "./permissions";

/** Role-level navigation and mutation policies. */
export const ROLE_POLICIES: Record<
  RoleSlug,
  {
    description: string;
    readOnlyMutation?: boolean;
    defaultLanding: string;
  }
> = {
  [RoleSlugConst.EMPLOYEE]: {
    description: "Individual contributor — personal learning and career tools",
    defaultLanding: "/dashboard",
  },
  [RoleSlugConst.MANAGER]: {
    description: "Manager — team and department workforce visibility",
    defaultLanding: "/dashboard",
  },
  [RoleSlugConst.ADMIN]: {
    description: "System administrator — full operational access",
    defaultLanding: "/dashboard",
  },
};

export function getDefaultLandingForRole(role: RoleSlug): string {
  return ROLE_POLICIES[role]?.defaultLanding ?? "/dashboard";
}

export function isReadOnlyExecutiveRole(_role: RoleSlug): boolean {
  return false;
}

/** Permissions employees should not receive unless explicitly granted. */
export const EMPLOYEE_RESTRICTED_PERMISSIONS: PermissionType[] = [
  Permission.USERS_VIEW,
  Permission.USERS_CREATE,
  Permission.USERS_UPDATE,
  Permission.USERS_DELETE,
  Permission.DEPARTMENTS_VIEW,
  Permission.DEPARTMENTS_MANAGE,
  Permission.ROLES_MANAGE,
  Permission.RBAC_MANAGE,
  Permission.PERMISSIONS_MANAGE,
  Permission.SETTINGS_VIEW,
  Permission.SETTINGS_MANAGE,
  Permission.AUDITLOGS_VIEW,
];
