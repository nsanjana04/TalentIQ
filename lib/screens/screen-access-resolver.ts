import type { Permission } from "@/lib/rbac/permissions";
import type { ScreenOverrideType } from "@prisma/client";
import { hasScreenPermission } from "@/lib/screens/screen-permissions";

export interface ScreenRecord {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  route: string;
  section: string;
  icon: string;
  sectionOrder: number;
  order: number;
  requiredPermission: string | null;
  isSidebarItem: boolean;
  isActive: boolean;
  isPersonal: boolean;
}

export interface RoleScreenAccessRecord {
  screenId: string;
  enabled: boolean;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManage: boolean;
}

export interface UserScreenOverrideRecord {
  screenId: string;
  overrideType: ScreenOverrideType;
  enabled: boolean | null;
  expiresAt?: Date | string | null;
}

export interface SidebarScreenItem {
  key: string;
  label: string;
  route: string;
  icon: string;
  order: number;
}

export interface SidebarSection {
  section: string;
  items: SidebarScreenItem[];
}

export interface ResolvedScreenAccessInput {
  screens: ScreenRecord[];
  roleAccess: RoleScreenAccessRecord[];
  userOverrides: UserScreenOverrideRecord[];
  permissions: Permission[];
  sidebarOnly?: boolean;
}

function normalizePath(path: string): string {
  return path.split("?")[0].replace(/\/$/, "") || "/";
}

export function isRoleScreenEnabled(
  screenId: string,
  roleAccess: RoleScreenAccessRecord[]
): boolean {
  return roleAccess.some((access) => access.screenId === screenId && access.enabled);
}

export function getUserOverride(
  screenId: string,
  overrides: UserScreenOverrideRecord[]
): UserScreenOverrideRecord | undefined {
  const override = overrides.find((row) => row.screenId === screenId);
  if (!override) return undefined;
  if (override.expiresAt && new Date(override.expiresAt) <= new Date()) {
    return undefined;
  }
  return override;
}

export function isScreenAccessible(
  screen: ScreenRecord,
  roleAccess: RoleScreenAccessRecord[],
  userOverrides: UserScreenOverrideRecord[],
  permissions: Permission[]
): boolean {
  if (!screen.isActive) return false;

  const override = getUserOverride(screen.id, userOverrides);
  if (override?.overrideType === "DENY") return false;

  const roleEnabled = isRoleScreenEnabled(screen.id, roleAccess);
  const overrideAllow = override?.overrideType === "ALLOW";

  if (!roleEnabled && !overrideAllow) return false;
  if (screen.isPersonal) return true;
  return hasScreenPermission(screen.requiredPermission, permissions);
}

export function resolveAccessibleScreens(input: ResolvedScreenAccessInput): ScreenRecord[] {
  const { screens, roleAccess, userOverrides, permissions, sidebarOnly = false } = input;

  return screens
    .filter((screen) => {
      if (sidebarOnly && (!screen.isSidebarItem || !screen.isActive)) return false;
      return isScreenAccessible(screen, roleAccess, userOverrides, permissions);
    })
    .sort((a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order);
}

export function groupScreensBySection(screens: ScreenRecord[]): SidebarSection[] {
  const sections = new Map<string, SidebarScreenItem[]>();

  for (const screen of screens) {
    if (!sections.has(screen.section)) {
      sections.set(screen.section, []);
    }
    sections.get(screen.section)!.push({
      key: screen.key,
      label: screen.label,
      route: screen.route,
      icon: screen.icon,
      order: screen.order,
    });
  }

  return Array.from(sections.entries()).map(([section, items]) => ({
    section,
    items: items.sort((a, b) => a.order - b.order),
  }));
}

export function findScreenByKeyOrRoute(
  screens: ScreenRecord[],
  keyOrRoute: string
): ScreenRecord | undefined {
  const normalized = normalizePath(keyOrRoute);
  return (
    screens.find((screen) => screen.key === keyOrRoute) ??
    screens.find((screen) => normalizePath(screen.route) === normalized) ??
    screens.find(
      (screen) =>
        normalized.startsWith(`${normalizePath(screen.route)}/`) ||
        normalized === normalizePath(screen.route)
    )
  );
}

export function canAccessScreenFromData(
  screens: ScreenRecord[],
  roleAccess: RoleScreenAccessRecord[],
  userOverrides: UserScreenOverrideRecord[],
  permissions: Permission[],
  keyOrRoute: string
): boolean {
  const screen = findScreenByKeyOrRoute(screens, keyOrRoute);
  if (!screen) return false;
  return isScreenAccessible(screen, roleAccess, userOverrides, permissions);
}

export function findScreenForPathname(
  screens: ScreenRecord[],
  pathname: string
): ScreenRecord | undefined {
  const normalized = normalizePath(pathname);
  const sorted = [...screens].sort(
    (a, b) => normalizePath(b.route).length - normalizePath(a.route).length
  );
  return sorted.find((screen) => {
    const route = normalizePath(screen.route);
    return normalized === route || normalized.startsWith(`${route}/`);
  });
}
