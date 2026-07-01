import { ALL_PERMISSIONS, type Permission } from "@/lib/rbac/permissions";

/**
 * Screen registry permission keys (may differ from canonical Permission enum).
 * Values are resolved to canonical Permission keys at access-check time.
 */
export const SCREEN_PERMISSION_ALIASES: Record<string, Permission> = {
  "dashboard.view": "dashboard.view",
  "ai.copilot.view": "dashboard.view",
  "executive.view": "analytics.executive.view",
  "learning.view": "courses.view",
  "courses.view": "courses.view",
  "assessments.view": "assessments.take",
  "certificates.view": "certificates.self.view",
  "analytics.view": "analytics.view",
  "reports.view": "reports.view",
  "users.view": "users.view",
  "rbac.manage": "rbac.manage",
  "auditlogs.view": "auditlogs.view",
  "departments.manage": "departments.manage",
  "settings.view": "settings.view",
  "learning.assignments.create": "learning.assignments.create",
  "learning.assignments.view": "learning.assignments.view",
  "learning.courses.manage": "learning.courses.manage",
};

export const VALID_SCREEN_PERMISSION_KEYS = new Set([
  ...Object.keys(SCREEN_PERMISSION_ALIASES),
  ...ALL_PERMISSIONS,
]);

export function resolveScreenPermission(required: string | null | undefined): Permission | null {
  if (!required) return null;
  if (required in SCREEN_PERMISSION_ALIASES) {
    return SCREEN_PERMISSION_ALIASES[required];
  }
  if (ALL_PERMISSIONS.includes(required as Permission)) {
    return required as Permission;
  }
  return null;
}

export function hasScreenPermission(
  required: string | null | undefined,
  permissions: Permission[]
): boolean {
  const resolved = resolveScreenPermission(required);
  if (!resolved) return true;
  return permissions.includes(resolved);
}
