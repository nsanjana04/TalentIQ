import { ALL_ROLE_SLUGS, RoleSlug, type RoleSlug as RoleSlugType } from "./role-slugs";
import type { RoleDefinition } from "@/types/rbac";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";

export { RoleSlug, ALL_ROLE_SLUGS };

export const ROLE_LABELS: Record<RoleSlugType, string> = {
  [RoleSlug.EMPLOYEE]: "Employee",
  [RoleSlug.MANAGER]: "Manager",
  [RoleSlug.ADMIN]: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<RoleSlugType, string> = {
  [RoleSlug.EMPLOYEE]:
    "Individual contributor with access to personal learning and career tools",
  [RoleSlug.MANAGER]:
    "Manages team learning, skills visibility, and department workforce insights",
  [RoleSlug.ADMIN]: "Full system administration and configuration access",
};

export const ALL_ROLES = ALL_ROLE_SLUGS;

export function getRoleDefinition(role: RoleSlugType): RoleDefinition {
  return {
    role,
    label: ROLE_LABELS[role],
    description: ROLE_DESCRIPTIONS[role],
    permissions: getDefaultPermissionsForRole(role),
  };
}
