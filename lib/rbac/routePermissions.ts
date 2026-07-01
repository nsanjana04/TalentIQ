import { Permission, type Permission as PermissionType } from "./permissions";
import { canAny } from "./check";
import { ROUTES } from "@/constants/routes";
import type { RoutePermissionRule } from "./types";

export type { RoutePermissionRule, ApiPermissionRule } from "./types";

/**
 * Page route → required permissions (longest match wins).
 */
export const ROUTE_PERMISSION_RULES: RoutePermissionRule[] = [
  { path: ROUTES.DASHBOARD, permissions: [Permission.DASHBOARD_VIEW], mode: "any", module: "dashboard" },
  { path: ROUTES.AI_COPILOT, permissions: [Permission.DASHBOARD_VIEW], mode: "any", module: "dashboard" },
  { path: "/executive-war-room", permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW], mode: "any", module: "analytics" },
  { path: "/account", permissions: [], mode: "any", module: "account", accessType: "authenticated" },
  { path: ROUTES.SETTINGS, permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE], mode: "any", module: "settings" },
  { path: "/settings/security", permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE], mode: "any", module: "settings" },

  { path: ROUTES.EMPLOYEES, permissions: [Permission.USERS_VIEW], mode: "any", module: "users" },
  { path: "/contractors", permissions: [Permission.USERS_VIEW], mode: "any", module: "users" },
  { path: "/teams", permissions: [Permission.DEPARTMENTS_VIEW, Permission.USERS_VIEW], mode: "any", module: "departments" },
  { path: ROUTES.ADMIN_PEOPLE, permissions: [Permission.USERS_VIEW, Permission.DEPARTMENTS_VIEW, Permission.DEPARTMENTS_MANAGE], mode: "any", module: "users" },
  { path: "/admin/users", permissions: [Permission.USERS_VIEW], mode: "any", module: "users" },
  { path: "/departments", permissions: [Permission.DEPARTMENTS_VIEW, Permission.DEPARTMENTS_MANAGE], mode: "any", module: "departments" },

  { path: ROUTES.LEARNING, permissions: [Permission.COURSES_VIEW, Permission.LEARNING_ENROLL], mode: "any", module: "learning" },
  { path: "/course", permissions: [Permission.COURSES_VIEW, Permission.LEARNING_ENROLL], mode: "any", module: "learning" },

  { path: ROUTES.COURSES, permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any", module: "courses" },
  { path: ROUTES.ASSESSMENTS, permissions: [Permission.ASSESSMENTS_TAKE, Permission.ASSESSMENTS_MANAGE, Permission.COURSES_VIEW], mode: "any", module: "assessments" },
  { path: ROUTES.CERTIFICATIONS, permissions: [Permission.CERTIFICATES_SELF_VIEW, Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE], mode: "any", module: "certificates" },

  { path: ROUTES.ANALYTICS, permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXECUTIVE_VIEW], mode: "any", module: "analytics" },
  { path: ROUTES.REPORTS, permissions: [Permission.REPORTS_VIEW], mode: "any", module: "reports" },
  { path: ROUTES.WAR_ROOM, permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW], mode: "any", module: "analytics" },

  { path: ROUTES.ADMIN, permissions: [Permission.SETTINGS_MANAGE, Permission.ROLES_MANAGE, Permission.USERS_VIEW], mode: "any", module: "administration" },
  { path: ROUTES.ADMIN_ROLES, permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE, Permission.PERMISSIONS_MANAGE], mode: "any", module: "rbac" },
  { path: "/admin/screen-access", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any", module: "rbac" },
  { path: "/api/admin/screens", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any", module: "rbac" },
  { path: "/admin/settings", permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE], mode: "any", module: "settings" },
  { path: ROUTES.ADMIN_LEARNING, permissions: [Permission.LEARNING_COURSES_VIEW, Permission.LEARNING_COURSES_MANAGE, Permission.COURSES_MANAGE], mode: "any", module: "learning" },
];

export function getRoutePermissionRule(pathname: string): RoutePermissionRule | undefined {
  const sorted = [...ROUTE_PERMISSION_RULES].sort((a, b) => b.path.length - a.path.length);
  return sorted.find(
    (rule) => pathname === rule.path || pathname.startsWith(`${rule.path}/`)
  );
}

export function getModuleForPath(pathname: string): string {
  const rule = getRoutePermissionRule(pathname);
  if (rule?.module) return rule.module;
  const segment = pathname.split("/").filter(Boolean)[0] ?? "Protected Module";
  return segment;
}

/** Settings tab → required permission */
export const SETTINGS_TAB_PERMISSIONS: Record<string, Permission[]> = {
  general: [Permission.SETTINGS_GENERAL_MANAGE, Permission.SETTINGS_MANAGE],
  security: [Permission.SETTINGS_SECURITY_MANAGE, Permission.SETTINGS_MANAGE],
  email: [Permission.SETTINGS_EMAIL_MANAGE, Permission.SETTINGS_MANAGE],
  notifications: [Permission.SETTINGS_NOTIFICATIONS_MANAGE, Permission.SETTINGS_MANAGE],
  integrations: [Permission.INTEGRATIONS_MANAGE, Permission.SETTINGS_MANAGE],
  appearance: [Permission.SETTINGS_APPEARANCE_MANAGE, Permission.SETTINGS_MANAGE],
  system: [Permission.SETTINGS_SYSTEM_MANAGE, Permission.SETTINGS_MANAGE],
  rbac: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
  permissions: [Permission.PERMISSIONS_MANAGE, Permission.ROLES_MANAGE],
  audit: [Permission.AUDITLOGS_VIEW],
};

export function getVisibleSettingsTabs(permissions: PermissionType[]): string[] {
  return Object.entries(SETTINGS_TAB_PERMISSIONS)
    .filter(([, perms]) => canAny(permissions, perms))
    .map(([tab]) => tab);
}
