import { canAny, canAll } from "@/lib/rbac/check";
import { Permission as P, type Permission } from "@/lib/rbac/permissions";
import { getRoutePermissionRule } from "@/constants/route-permissions";

export interface UiAccessResult {
  visible: boolean;
  enabled: boolean;
  missing?: Permission[];
}

export interface UiElementRule {
  id: string;
  permissions: Permission[];
  mode: "any" | "all";
  /** If true, element is hidden when denied; otherwise shown but disabled */
  hideWhenDenied?: boolean;
}

export const UI_ELEMENT_RULES: Record<string, UiElementRule> = {
  "users.create.button": {
    id: "users.create.button",
    permissions: [P.USERS_CREATE],
    mode: "any",
    hideWhenDenied: true,
  },
  "users.edit.button": {
    id: "users.edit.button",
    permissions: [P.USERS_UPDATE],
    mode: "any",
    hideWhenDenied: true,
  },
  "users.delete.button": {
    id: "users.delete.button",
    permissions: [P.USERS_DELETE],
    mode: "any",
    hideWhenDenied: true,
  },
  "roles.manage.panel": {
    id: "roles.manage.panel",
    permissions: [P.ROLES_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "skills.manage.button": {
    id: "skills.manage.button",
    permissions: [P.COURSES_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "courses.manage.button": {
    id: "courses.manage.button",
    permissions: [P.COURSES_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "assessments.manage.button": {
    id: "assessments.manage.button",
    permissions: [P.ASSESSMENTS_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "certificates.manage.button": {
    id: "certificates.manage.button",
    permissions: [P.CERTIFICATES_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "analytics.export.button": {
    id: "analytics.export.button",
    permissions: [P.ANALYTICS_VIEW, P.REPORTS_VIEW],
    mode: "any",
    hideWhenDenied: false,
  },
  "settings.manage.panel": {
    id: "settings.manage.panel",
    permissions: [P.SETTINGS_MANAGE],
    mode: "any",
    hideWhenDenied: true,
  },
  "auditlogs.view.panel": {
    id: "auditlogs.view.panel",
    permissions: [P.AUDITLOGS_VIEW],
    mode: "any",
    hideWhenDenied: true,
  },
};

export const uiPermissionResolver = {
  canAccessRoute(pathname: string, permissions: Permission[]): UiAccessResult {
    const rule = getRoutePermissionRule(pathname);

    if (!rule) {
      return { visible: true, enabled: true };
    }

    const hasAccess =
      rule.mode === "all"
        ? canAll(permissions, rule.permissions)
        : canAny(permissions, rule.permissions);

    return {
      visible: hasAccess,
      enabled: hasAccess,
      missing: hasAccess
        ? undefined
        : rule.permissions.filter((p) => !permissions.includes(p)),
    };
  },

  resolveElement(elementId: string, permissions: Permission[]): UiAccessResult {
    const rule = UI_ELEMENT_RULES[elementId];

    if (!rule) {
      return { visible: true, enabled: true };
    }

    const hasAccess =
      rule.mode === "all"
        ? canAll(permissions, rule.permissions)
        : canAny(permissions, rule.permissions);

    return {
      visible: hasAccess || !rule.hideWhenDenied,
      enabled: hasAccess,
      missing: hasAccess
        ? undefined
        : rule.permissions.filter((p) => !permissions.includes(p)),
    };
  },

  can(permissions: Permission[], required: Permission | Permission[], mode: "any" | "all" = "any"): boolean {
    const requiredList = Array.isArray(required) ? required : [required];
    return mode === "all"
      ? canAll(permissions, requiredList)
      : canAny(permissions, requiredList);
  },

  getElementRules(): Record<string, UiElementRule> {
    return UI_ELEMENT_RULES;
  },
};
