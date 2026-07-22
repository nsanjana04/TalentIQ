#!/usr/bin/env tsx
/**
 * Validates navigation ↔ route RBAC alignment.
 * Exit code 1 on any violation.
 */
import { NAVIGATION_ITEMS } from "../config/navigation";
import { getRoutePermissionRule } from "../lib/rbac/routePermissions";
import { navHrefPathname, canAccessNavHref } from "../lib/rbac/navRouteAccess";
import { canAccess } from "../lib/rbac/canAccess";
import type { Permission } from "../lib/rbac/permissions";

const errors: string[] = [];

const seenIds = new Set<string>();

for (const item of NAVIGATION_ITEMS) {
  if (seenIds.has(item.id)) {
    errors.push(`Duplicate nav id: ${item.id}`);
  }
  seenIds.add(item.id);

  if (!item.isPersonal) {
    const required = item.requiredPermissions ?? item.permissions ?? [];
    if (required.length === 0) {
      errors.push(`Nav item "${item.id}" (${item.label}) has empty requiredPermissions`);
    }
  }

  const path = navHrefPathname(item.href);
  const routeRule = getRoutePermissionRule(path);

  if (!routeRule && !item.isPersonal) {
    errors.push(`Nav item "${item.id}" href ${item.href} has no matching route permission rule`);
    continue;
  }

  if (routeRule && routeRule.accessType !== "authenticated" && !item.isPersonal) {
    const navPerms = item.requiredPermissions ?? item.permissions ?? [];

    if (item.allowedRoles?.length && navPerms.length === 0) {
      errors.push(`Nav "${item.id}" uses allowedRoles without requiredPermissions`);
    }

    const navAccess = canAccess({
      permissions: navPerms,
      requiredPermissions: navPerms,
      permissionMode: item.mode ?? "any",
    });

    if (!navAccess.allowed) {
      errors.push(`Nav "${item.id}" requiredPermissions cannot be satisfied`);
    }

    if (!canAccessNavHref(item.href, navPerms, [], undefined)) {
      errors.push(
        `Nav "${item.id}" permissions [${navPerms.join(", ")}] do not grant route access to ${path} (requires [${routeRule.permissions.join(", ")}])`
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Navigation RBAC validation failed:\n");
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
}

console.log(`✓ Navigation RBAC valid (${NAVIGATION_ITEMS.length} items)`);
