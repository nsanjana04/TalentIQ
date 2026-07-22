import { NextResponse } from "next/server";
import type { RoleSlug } from "@/constants/role-slugs";
import { ALL_ROLE_SLUGS } from "@/constants/role-slugs";

export interface RoleRouteRule {
  path: string;
  roles: RoleSlug[];
  mode: "any" | "all";
}

/** Routes restricted to specific roles (in addition to permission checks) */
export const ROLE_ROUTE_RULES: RoleRouteRule[] = [
  {
    path: "/admin/roles",
    roles: ["ADMIN"] as RoleSlug[],
    mode: "any",
  },
  {
    path: "/admin/settings",
    roles: ["ADMIN"] as RoleSlug[],
    mode: "any",
  },
];

export function isValidRoleSlug(value: string): value is RoleSlug {
  return ALL_ROLE_SLUGS.includes(value as RoleSlug);
}

export function checkRoleAccess(
  pathname: string,
  role: string | undefined,
  baseUrl?: string
): NextResponse | null {
  if (!role || !isValidRoleSlug(role)) return null;

  const rule = ROLE_ROUTE_RULES.find(
    (r) => pathname === r.path || pathname.startsWith(`${r.path}/`)
  );

  if (!rule) return null;

  const hasRole =
    rule.mode === "all"
      ? rule.roles.every((r) => r === role)
      : rule.roles.includes(role);

  if (hasRole) return null;

  return NextResponse.redirect(new URL("/forbidden", baseUrl ?? "http://localhost"));
}

export const roleMiddleware = {
  check(pathname: string, role: string | undefined, baseUrl?: string): NextResponse | null {
    return checkRoleAccess(pathname, role, baseUrl);
  },

  getRules(): RoleRouteRule[] {
    return ROLE_ROUTE_RULES;
  },

  hasRole(role: RoleSlug, allowed: RoleSlug[]): boolean {
    return allowed.includes(role);
  },
};
