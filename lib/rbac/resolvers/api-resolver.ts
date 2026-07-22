import { canAny, canAll } from "@/lib/rbac/check";
import type { Permission } from "@/lib/rbac/permissions";
import type { ApiPermissionRule } from "@/lib/rbac/types";
import {
  getApiPermissionRule,
  API_PERMISSION_RULES,
} from "@/constants/route-permissions";

export interface ApiAccessResult {
  allowed: boolean;
  rule?: ApiPermissionRule;
  missing?: Permission[];
}

export const apiPermissionResolver = {
  resolve(method: string, pathname: string, permissions: Permission[]): ApiAccessResult {
    const rule = getApiPermissionRule(method, pathname);

    if (!rule) {
      return { allowed: true };
    }

    const hasAccess =
      rule.mode === "all"
        ? canAll(permissions, rule.permissions)
        : canAny(permissions, rule.permissions);

    if (hasAccess) {
      return { allowed: true, rule };
    }

    const missing = rule.permissions.filter((p) => !permissions.includes(p));
    return { allowed: false, rule, missing };
  },

  getRules(): ApiPermissionRule[] {
    return API_PERMISSION_RULES;
  },

  requiresPermission(method: string, pathname: string): boolean {
    return getApiPermissionRule(method, pathname) !== undefined;
  },
};
