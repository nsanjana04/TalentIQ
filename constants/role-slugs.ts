export const RoleSlug = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type RoleSlug = (typeof RoleSlug)[keyof typeof RoleSlug];

export const ALL_ROLE_SLUGS = Object.values(RoleSlug);
