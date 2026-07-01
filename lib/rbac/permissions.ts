/**
 * Canonical permission keys for TalentIQ enterprise RBAC.
 * Format: resource.action
 */
export const Permission = {
  DASHBOARD_VIEW: "dashboard.view",

  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  ROLES_MANAGE: "roles.manage",
  RBAC_MANAGE: "rbac.manage",
  PERMISSIONS_MANAGE: "permissions.manage",

  DEPARTMENTS_VIEW: "departments.view",
  DEPARTMENTS_MANAGE: "departments.manage",

  COURSES_VIEW: "courses.view",
  COURSES_MANAGE: "courses.manage",

  ASSESSMENTS_TAKE: "assessments.take",
  ASSESSMENTS_MANAGE: "assessments.manage",
  ASSESSMENTS_GRADE: "assessments.grade",

  CERTIFICATES_SELF_VIEW: "certificates.self.view",
  CERTIFICATES_VIEW: "certificates.view",
  CERTIFICATES_MANAGE: "certificates.manage",

  LEARNING_ENROLL: "learning.enroll",
  LEARNING_ASSIGN: "learning.assign",
  LEARNING_TEAM_VIEW: "learning.team.view",

  LEARNING_COURSES_VIEW: "learning.courses.view",
  LEARNING_COURSES_MANAGE: "learning.courses.manage",
  LEARNING_ASSIGNMENTS_VIEW: "learning.assignments.view",
  LEARNING_ASSIGNMENTS_CREATE: "learning.assignments.create",
  LEARNING_ASSIGNMENTS_UPDATE: "learning.assignments.update",
  LEARNING_ASSIGNMENTS_CANCEL: "learning.assignments.cancel",
  LEARNING_PROGRESS_VIEW: "learning.progress.view",
  LEARNING_REPORTS_EXPORT: "learning.reports.export",

  ANALYTICS_EXECUTIVE_VIEW: "analytics.executive.view",
  ANALYTICS_VIEW: "analytics.view",

  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  SETTINGS_VIEW: "settings.view",
  SETTINGS_MANAGE: "settings.manage",
  SETTINGS_GENERAL_MANAGE: "settings.general.manage",
  SETTINGS_SECURITY_MANAGE: "settings.security.manage",
  SETTINGS_EMAIL_MANAGE: "settings.email.manage",
  SETTINGS_NOTIFICATIONS_MANAGE: "settings.notifications.manage",
  SETTINGS_APPEARANCE_MANAGE: "settings.appearance.manage",
  SETTINGS_SYSTEM_MANAGE: "settings.system.manage",

  INTEGRATIONS_MANAGE: "integrations.manage",

  AUDITLOGS_VIEW: "auditlogs.view",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

/** Any of these grants access to RBAC admin APIs (roles, permissions matrix, settings role summary). */
export const RBAC_ADMIN_PERMISSIONS: Permission[] = [
  Permission.RBAC_MANAGE,
  Permission.ROLES_MANAGE,
  Permission.PERMISSIONS_MANAGE,
];

export const PERMISSION_MODULES = [
  "dashboard",
  "users",
  "roles",
  "rbac",
  "permissions",
  "departments",
  "courses",
  "assessments",
  "certificates",
  "learning",
  "analytics",
  "reports",
  "settings",
  "integrations",
  "auditlogs",
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.DASHBOARD_VIEW]: "View Dashboard",

  [Permission.USERS_VIEW]: "View Users",
  [Permission.USERS_CREATE]: "Create Users",
  [Permission.USERS_UPDATE]: "Update Users",
  [Permission.USERS_DELETE]: "Delete Users",

  [Permission.ROLES_MANAGE]: "Manage Roles & Permissions",
  [Permission.RBAC_MANAGE]: "Manage Role-Based Access",
  [Permission.PERMISSIONS_MANAGE]: "Manage Permission Toggles",

  [Permission.DEPARTMENTS_VIEW]: "View Departments",
  [Permission.DEPARTMENTS_MANAGE]: "Manage Departments",

  [Permission.COURSES_VIEW]: "View Courses",
  [Permission.COURSES_MANAGE]: "Manage Courses",

  [Permission.ASSESSMENTS_TAKE]: "Take Assessments",
  [Permission.ASSESSMENTS_MANAGE]: "Manage Assessments",
  [Permission.ASSESSMENTS_GRADE]: "Grade Assessments",

  [Permission.CERTIFICATES_SELF_VIEW]: "View Own Certificates",
  [Permission.CERTIFICATES_VIEW]: "View All Certificates",
  [Permission.CERTIFICATES_MANAGE]: "Manage Certificates",

  [Permission.LEARNING_ENROLL]: "Enroll in Learning",
  [Permission.LEARNING_ASSIGN]: "Assign Learning",
  [Permission.LEARNING_TEAM_VIEW]: "View Team Learning",

  [Permission.LEARNING_COURSES_VIEW]: "View Learning Courses",
  [Permission.LEARNING_COURSES_MANAGE]: "Manage Learning Courses",
  [Permission.LEARNING_ASSIGNMENTS_VIEW]: "View Course Assignments",
  [Permission.LEARNING_ASSIGNMENTS_CREATE]: "Create Course Assignments",
  [Permission.LEARNING_ASSIGNMENTS_UPDATE]: "Update Course Assignments",
  [Permission.LEARNING_ASSIGNMENTS_CANCEL]: "Cancel Course Assignments",
  [Permission.LEARNING_PROGRESS_VIEW]: "View Learning Progress",
  [Permission.LEARNING_REPORTS_EXPORT]: "Export Learning Reports",

  [Permission.ANALYTICS_EXECUTIVE_VIEW]: "View Executive Analytics",
  [Permission.ANALYTICS_VIEW]: "View Analytics",

  [Permission.REPORTS_VIEW]: "View Reports",
  [Permission.REPORTS_EXPORT]: "Export Reports",

  [Permission.SETTINGS_VIEW]: "View System Settings",
  [Permission.SETTINGS_MANAGE]: "Manage Settings",
  [Permission.SETTINGS_GENERAL_MANAGE]: "Manage General Settings",
  [Permission.SETTINGS_SECURITY_MANAGE]: "Manage Security Settings",
  [Permission.SETTINGS_EMAIL_MANAGE]: "Manage Email Settings",
  [Permission.SETTINGS_NOTIFICATIONS_MANAGE]: "Manage Notification Settings",
  [Permission.SETTINGS_APPEARANCE_MANAGE]: "Manage Appearance Settings",
  [Permission.SETTINGS_SYSTEM_MANAGE]: "Manage System Settings",

  [Permission.INTEGRATIONS_MANAGE]: "Manage Integrations",

  [Permission.AUDITLOGS_VIEW]: "View Audit Logs",
};

export function getPermissionModule(permission: Permission): PermissionModule {
  return permission.split(".")[0] as PermissionModule;
}

export function isValidPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.includes(value as Permission);
}
