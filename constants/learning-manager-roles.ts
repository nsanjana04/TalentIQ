import type { RoleSlug } from "@/constants/role-slugs";
import { RoleSlug as RoleSlugConst } from "@/constants/role-slugs";

/** Roles that can manage learning content and assign courses to employees. */
export const LEARNING_MANAGER_ROLES: RoleSlug[] = [
  RoleSlugConst.ADMIN,
  RoleSlugConst.MANAGER,
];

export function isLearningManagerRole(role: RoleSlug): boolean {
  return LEARNING_MANAGER_ROLES.includes(role);
}
