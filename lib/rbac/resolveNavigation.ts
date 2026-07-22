import { NAVIGATION_ITEMS, groupNavBySection, type NavSection } from "@/config/navigation";
import { filterNavigation } from "@/lib/rbac/filterNavigation";
import { normalizeRole } from "@/lib/rbac/normalizeRole";
import type { SidebarNavItem } from "@/lib/rbac/types";
import type { Permission } from "@/lib/rbac/permissions";
import type { RoleSlug } from "@/constants/role-slugs";

export interface ResolvedNavigationSection {
  section: NavSection;
  items: SidebarNavItem[];
}

export interface ResolveNavigationInput {
  role?: string | RoleSlug | null;
  permissions?: Permission[];
  deniedPermissions?: Permission[];
  isActive?: boolean;
}

export interface ResolvedNavigationResult {
  flatItems: SidebarNavItem[];
  sections: ResolvedNavigationSection[];
}

/** Flatten nested nav items (parents with visible children) for section grouping. */
export function flattenNavItems(items: SidebarNavItem[]): SidebarNavItem[] {
  const result: SidebarNavItem[] = [];

  for (const item of items) {
    if (item.children?.length) {
      result.push(...flattenNavItems(item.children));
    } else {
      result.push(item);
    }
  }

  return result;
}

export function resolveNavigation(input: ResolveNavigationInput): ResolvedNavigationResult {
  const role = normalizeRole(input.role ?? undefined);
  const permissions = input.permissions ?? [];
  const denied = input.deniedPermissions ?? [];

  if (input.isActive === false) {
    return { flatItems: [], sections: [] };
  }

  const filtered = filterNavigation({
    navigation: NAVIGATION_ITEMS,
    user: {
      role,
      permissions,
      deniedPermissions: denied,
      isActive: input.isActive ?? true,
    },
    effectivePermissions: permissions,
  });

  const flatItems = flattenNavItems(filtered);
  const sections = groupNavBySection(flatItems);

  return { flatItems, sections };
}
