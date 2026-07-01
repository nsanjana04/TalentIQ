export {
  ROUTE_PERMISSION_RULES,
  getRoutePermissionRule,
  getModuleForPath,
  SETTINGS_TAB_PERMISSIONS,
  getVisibleSettingsTabs,
} from "@/lib/rbac/routePermissions";

import { Permission } from "@/lib/rbac/permissions";
import type { ApiPermissionRule } from "@/lib/rbac/types";

/**
 * API route → required permissions
 */
export const API_PERMISSION_RULES: ApiPermissionRule[] = [
  { method: "GET", path: "/api/rbac/permissions", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/rbac/roles", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/rbac/matrix", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/rbac/roles/", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "PUT", path: "/api/rbac/roles/", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "PATCH", path: "/api/rbac/roles/", permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/dashboard/", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/users", permissions: [Permission.USERS_VIEW], mode: "any" },
  { method: "GET", path: "/api/users/", permissions: [Permission.USERS_VIEW], mode: "any" },
  { method: "PATCH", path: "/api/users/", permissions: [Permission.USERS_UPDATE], mode: "any" },
  { method: "POST", path: "/api/users/", permissions: [Permission.USERS_DELETE], mode: "any" },
  { method: "GET", path: "/api/skills/", permissions: [Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "POST", path: "/api/skills/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "PATCH", path: "/api/skills/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "DELETE", path: "/api/skills/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/settings/notification-preferences", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "PATCH", path: "/api/settings/notification-preferences", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/settings/overview", permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE], mode: "any" },
  { method: "PATCH", path: "/api/settings/", permissions: [Permission.SETTINGS_MANAGE], mode: "any" },
  { method: "GET", path: "/api/settings/", permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE], mode: "any" },
  { method: "GET", path: "/api/audit-logs", permissions: [Permission.AUDITLOGS_VIEW], mode: "any" },
  { method: "GET", path: "/api/notifications", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "POST", path: "/api/notifications/", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/analytics/", permissions: [Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXECUTIVE_VIEW], mode: "any" },
  { method: "GET", path: "/api/ai-insights", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "POST", path: "/api/ai-insights", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/ai-insights/export", permissions: [Permission.DASHBOARD_VIEW, Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT], mode: "any" },
  { method: "POST", path: "/api/ai-insights/compare", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/employees/", permissions: [Permission.USERS_VIEW], mode: "any" },
  { method: "GET", path: "/api/navigation/badges", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/skill-matrix/gaps", permissions: [Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/skill-matrix/readiness", permissions: [Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/skill-matrix/export", permissions: [Permission.ANALYTICS_VIEW, Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT], mode: "any" },
  { method: "GET", path: "/api/skill-matrix/", permissions: [Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/learning/", permissions: [Permission.COURSES_VIEW, Permission.LEARNING_ENROLL], mode: "any" },
  { method: "POST", path: "/api/learning/enroll", permissions: [Permission.LEARNING_ENROLL, Permission.COURSES_VIEW], mode: "any" },
  { method: "POST", path: "/api/learning/complete-external", permissions: [Permission.LEARNING_ENROLL, Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/learning/open-courses", permissions: [Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/learning/open-courses/summary", permissions: [Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/learning/resources", permissions: [Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/learning/content/overview", permissions: [Permission.COURSES_VIEW], mode: "any" },
  { method: "POST", path: "/api/learning/open-courses/", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/admin/learning/", permissions: [Permission.COURSES_MANAGE, Permission.LEARNING_COURSES_VIEW, Permission.LEARNING_ASSIGNMENTS_VIEW, Permission.LEARNING_ASSIGNMENTS_CREATE, Permission.LEARNING_PROGRESS_VIEW], mode: "any" },
  { method: "POST", path: "/api/admin/learning/", permissions: [Permission.COURSES_MANAGE, Permission.LEARNING_ASSIGNMENTS_CREATE], mode: "any" },
  { method: "PATCH", path: "/api/admin/learning/", permissions: [Permission.COURSES_MANAGE, Permission.LEARNING_ASSIGNMENTS_UPDATE], mode: "any" },
  { method: "DELETE", path: "/api/admin/learning/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/courses/overview", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/courses/meta", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/courses/", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/courses", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "PATCH", path: "/api/courses/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "DELETE", path: "/api/courses/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/courses/lessons/", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/courses/modules/", permissions: [Permission.COURSES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/assessments/available", permissions: [Permission.ASSESSMENTS_TAKE, Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/assessments/overview", permissions: [Permission.ASSESSMENTS_MANAGE], mode: "any" },
  { method: "GET", path: "/api/assessments/question-bank", permissions: [Permission.ASSESSMENTS_MANAGE], mode: "any" },
  { method: "POST", path: "/api/assessments/question-bank", permissions: [Permission.ASSESSMENTS_MANAGE], mode: "any" },
  { method: "GET", path: "/api/assessments/attempts", permissions: [Permission.ASSESSMENTS_MANAGE, Permission.ASSESSMENTS_GRADE], mode: "any" },
  { method: "POST", path: "/api/assessments/", permissions: [Permission.ASSESSMENTS_TAKE, Permission.ASSESSMENTS_MANAGE, Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/assessments/", permissions: [Permission.ASSESSMENTS_TAKE, Permission.ASSESSMENTS_MANAGE, Permission.COURSES_VIEW], mode: "any" },
  { method: "PATCH", path: "/api/assessments/", permissions: [Permission.ASSESSMENTS_MANAGE, Permission.ASSESSMENTS_GRADE], mode: "any" },
  { method: "DELETE", path: "/api/assessments/", permissions: [Permission.ASSESSMENTS_MANAGE], mode: "any" },
  { method: "GET", path: "/api/certificates/my", permissions: [Permission.CERTIFICATES_SELF_VIEW, Permission.COURSES_VIEW], mode: "any" },
  { method: "GET", path: "/api/certificates/overview", permissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/certificates/meta", permissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/certificates/analytics", permissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/certificates/templates", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/certificates/templates", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/certificates/", permissions: [Permission.CERTIFICATES_VIEW, Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/certificates", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "PATCH", path: "/api/certificates/templates/", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "DELETE", path: "/api/certificates/templates/", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "POST", path: "/api/certificates/", permissions: [Permission.CERTIFICATES_MANAGE], mode: "any" },
  { method: "GET", path: "/api/search", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "POST", path: "/api/notifications/read-all", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/notifications/stream", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "GET", path: "/api/succession", permissions: [Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/forecasting", permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW, Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "POST", path: "/api/forecasting", permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW, Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/war-room", permissions: [Permission.ANALYTICS_EXECUTIVE_VIEW, Permission.ANALYTICS_VIEW], mode: "any" },
  { method: "GET", path: "/api/system/bootstrap", permissions: [Permission.DASHBOARD_VIEW], mode: "any" },
  { method: "POST", path: "/api/system/bootstrap", permissions: [Permission.SETTINGS_MANAGE, Permission.SETTINGS_SYSTEM_MANAGE], mode: "any" },
  { method: "GET", path: "/api/reports/executive/export", permissions: [Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT], mode: "any" },
  { method: "GET", path: "/api/learning/lrs/", permissions: [Permission.COURSES_VIEW, Permission.ANALYTICS_VIEW, Permission.REPORTS_VIEW], mode: "any" },
  { method: "POST", path: "/api/learning/lrs/", permissions: [Permission.COURSES_VIEW, Permission.COURSES_MANAGE], mode: "any" },
];

export function getApiPermissionRule(
  method: string,
  pathname: string
): ApiPermissionRule | undefined {
  const matches = API_PERMISSION_RULES.filter((rule) => {
    const methodMatch = rule.method === method || rule.method === "*";
    const pathMatch =
      rule.path.endsWith("/")
        ? pathname.startsWith(rule.path)
        : pathname === rule.path || pathname.startsWith(`${rule.path}/`);
    return methodMatch && pathMatch;
  });

  if (matches.length === 0) return undefined;

  return matches.sort((a, b) => b.path.length - a.path.length)[0];
}
