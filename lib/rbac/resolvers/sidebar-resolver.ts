import { Permission } from "@/lib/rbac/permissions";
import type { SidebarNavItem } from "@/lib/rbac/types";
import type { RoleSlug } from "@/constants/role-slugs";
import { NAVIGATION_ITEMS } from "@/config/navigation";
import { filterNavigation, canAccessNavItem as canAccessNavItemFn } from "@/lib/rbac/filterNavigation";

/** @deprecated Unfiltered — use filterNavigation() at runtime */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [];

/** Nav tree filtered by the signed-in user's permissions and role. */
export const sidebarPermissionResolver = {
  resolve(
    permissions: Permission[] = [],
    role?: RoleSlug,
    denied: Permission[] = []
  ): SidebarNavItem[] {
    return filterNavigation({
      navigation: NAVIGATION_ITEMS,
      user: { role, permissions, deniedPermissions: denied },
      effectivePermissions: permissions,
    });
  },

  canAccessNavItem(
    itemId: string,
    permissions: Permission[],
    role?: RoleSlug,
    denied: Permission[] = []
  ): boolean {
    return canAccessNavItemFn(itemId, NAVIGATION_ITEMS, permissions, role, denied);
  },
};

export { filterNavigation };
