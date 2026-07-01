export {
  PERMISSION_LABELS,
  getPermissionModule,
  type Permission,
  type PermissionModule,
} from "./permissions";

import { PERMISSION_LABELS, type Permission } from "./permissions";

/** Human-readable module name for forbidden page UI. */
export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Command Center",
  users: "User Management",
  roles: "Roles & Permissions",
  rbac: "Role-Based Access",
  permissions: "Permission Toggles",
  departments: "Departments",
  courses: "Courses",
  assessments: "Assessments",
  certificates: "Certifications",
  learning: "Learning",
  analytics: "Workforce Analytics",
  reports: "Reports",
  settings: "System Settings",
  account: "Account",
  integrations: "Integrations",
  auditlogs: "Audit Logs",
};

export function getModuleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] ?? moduleKey;
}

export function getPermissionLabel(key: string): string {
  return PERMISSION_LABELS[key as Permission] ?? key;
}
