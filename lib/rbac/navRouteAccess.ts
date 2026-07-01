import type { RoleSlug } from "@/constants/role-slugs";
import { getRoutePermissionRule } from "@/lib/rbac/routePermissions";
import { canAccess } from "./canAccess";
import type { Permission } from "./permissions";

/** Strip query/hash from nav href before route matching. */
export function navHrefPathname(href: string): string {
  return href.split("?")[0].split("#")[0];
}

/** Check whether the user can access a nav item's target route. */
export function canAccessNavHref(
  href: string,
  permissions: Permission[],
  denied: Permission[] = [],
  role?: RoleSlug
): boolean {
  const rule = getRoutePermissionRule(navHrefPathname(href));

  if (!rule) {
    return true;
  }

  if (rule.accessType === "authenticated") {
    return true;
  }

  return canAccess({
    permissions,
    denied,
    role,
    requiredPermissions: rule.permissions,
    permissionMode: rule.mode ?? "any",
    allowedRoles: rule.allowedRoles,
  }).allowed;
}
