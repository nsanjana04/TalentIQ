import { ALL_ROLE_SLUGS, RoleSlug, type RoleSlug as RoleSlugType } from "@/constants/role-slugs";

/** Display order for role pickers (Admin → Manager → Employee). */
export const CANONICAL_ROLE_ORDER: RoleSlugType[] = [
  RoleSlug.ADMIN,
  RoleSlug.MANAGER,
  RoleSlug.EMPLOYEE,
];

export const CANONICAL_ROLE_SLUGS = ALL_ROLE_SLUGS;

export function isCanonicalRoleSlug(slug: string): slug is RoleSlugType {
  return CANONICAL_ROLE_SLUGS.includes(slug as RoleSlugType);
}

/** Map legacy role slugs to the 3 canonical roles before retirement. */
export function resolveLegacyRoleMigrationTarget(slug: string): RoleSlugType {
  const normalized = slug.toUpperCase().replace(/[\s-]+/g, "_");
  if (isCanonicalRoleSlug(normalized)) return normalized;

  const legacyTargets: Record<string, RoleSlugType> = {
    CEO: RoleSlug.ADMIN,
    PLATFORM_OWNER: RoleSlug.ADMIN,
    HR_MANAGER: RoleSlug.MANAGER,
    DEPARTMENT_MANAGER: RoleSlug.MANAGER,
    TEAM_LEADER: RoleSlug.MANAGER,
    INSTRUCTOR: RoleSlug.EMPLOYEE,
  };

  return legacyTargets[normalized] ?? RoleSlug.EMPLOYEE;
}

export function sortCanonicalRoles<T extends { slug: string }>(roles: T[]): T[] {
  const order = new Map(CANONICAL_ROLE_ORDER.map((slug, index) => [slug, index]));
  return [...roles].sort(
    (a, b) => (order.get(a.slug as RoleSlugType) ?? 99) - (order.get(b.slug as RoleSlugType) ?? 99)
  );
}

export const canonicalRoleWhere = {
  deletedAt: null,
  slug: { in: [...CANONICAL_ROLE_SLUGS] as string[] },
};
