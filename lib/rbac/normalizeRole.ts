import { ALL_ROLE_SLUGS, type RoleSlug } from "@/constants/role-slugs";

/**
 * Normalize role strings to canonical RoleSlug.
 * Accepts ADMIN, Admin, admin, department-manager, etc.
 */
export function normalizeRole(role: string | undefined | null): RoleSlug | undefined {
  if (!role) return undefined;

  const normalized = role.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (ALL_ROLE_SLUGS.includes(normalized as RoleSlug)) {
    return normalized as RoleSlug;
  }

  return undefined;
}
