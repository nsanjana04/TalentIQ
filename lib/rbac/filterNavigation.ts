import type { RoleSlug } from "@/constants/role-slugs";
import { normalizeRole } from "./normalizeRole";
import { canAccess } from "./canAccess";
import { canAccessNavHref } from "./navRouteAccess";
import type { NavigationItem } from "@/config/navigation";
import type { Permission } from "./permissions";
import type { SidebarNavItem } from "./types";

export interface FilterNavigationInput {
  navigation: NavigationItem[];
  user?: {
    role?: RoleSlug;
    isActive?: boolean;
    permissions?: Permission[];
    deniedPermissions?: Permission[];
  } | null;
  effectivePermissions?: Permission[];
}

function mapNavItem(item: NavigationItem): SidebarNavItem {
  const { badgeKey, ...rest } = item;
  void badgeKey;
  return rest;
}

function itemVisible(
  item: NavigationItem,
  permissions: Permission[],
  denied: Permission[],
  role?: RoleSlug
): boolean {
  if (item.isPersonal) return true;

  const required = item.requiredPermissions ?? item.permissions ?? [];

  const navAccess = canAccess({
    permissions,
    denied,
    role,
    requiredPermissions: required,
    permissionMode: item.mode ?? "any",
    allowedRoles: item.allowedRoles ?? item.roles,
    disallowedRoles: item.disallowedRoles,
    isPersonal: false,
  });

  if (!navAccess.allowed) return false;

  return canAccessNavHref(item.href, permissions, denied, role);
}

/**
 * Filter navigation tree by effective permissions and role constraints.
 * Hides parents when all children are hidden; empty sections are omitted by groupNavBySection.
 */
export function filterNavigation(input: FilterNavigationInput): SidebarNavItem[] {
  const permissions = input.effectivePermissions ?? input.user?.permissions ?? [];
  const denied = input.user?.deniedPermissions ?? [];
  const role = normalizeRole(input.user?.role ?? undefined);

  if (input.user && input.user.isActive === false) return [];

  function filterItems(items: NavigationItem[]): SidebarNavItem[] {
    return items
      .map((item) => {
        const childSource = item.children ?? [];
        if (childSource.length > 0) {
          const children = filterItems(childSource as NavigationItem[]);
          if (children.length === 0) return null;
          return { ...mapNavItem(item), children };
        }

        if (!itemVisible(item, permissions, denied, role)) return null;
        return mapNavItem(item);
      })
      .filter((item): item is SidebarNavItem => item !== null);
  }

  return filterItems(input.navigation);
}

export function canAccessNavItem(
  itemId: string,
  navigation: NavigationItem[],
  permissions: Permission[],
  role?: RoleSlug,
  denied: Permission[] = []
): boolean {
  const find = (items: NavigationItem[]): NavigationItem | undefined => {
    for (const item of items) {
      if (item.id === itemId) return item;
      if (item.children?.length) {
        const found = find(item.children as NavigationItem[]);
        if (found) return found;
      }
    }
  };

  const item = find(navigation);
  if (!item) return false;
  return itemVisible(item, permissions, denied, normalizeRole(role));
}
