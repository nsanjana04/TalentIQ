import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "./permissions";

export interface EffectivePermissions {
  userId: string;
  roleSlug: RoleSlug;
  roleId: string;
  permissions: Permission[];
  granted: Permission[];
  denied: Permission[];
  grantSources?: Map<Permission, "role" | "user_override" | "screen_override">;
}

export interface PermissionCheckResult {
  permission: Permission;
  granted: boolean;
  source: "role" | "user_grant" | "user_deny" | "none";
}

export interface RoutePermissionRule {
  path: string;
  permissions: Permission[];
  mode: "any" | "all";
  module?: string;
  accessType?: "authenticated" | "permission";
  scopeType?: string;
  allowedRoles?: RoleSlug[];
}

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  permissions: Permission[];
  mode: "any" | "all";
  /** @deprecated use allowedRoles */
  roles?: RoleSlug[];
  allowedRoles?: RoleSlug[];
  disallowedRoles?: RoleSlug[];
  requiredPermissions?: Permission[];
  children?: SidebarNavItem[];
  section?: string;
  badgeCount?: number;
  badgeKey?: string;
  isExactMatch?: boolean;
  isAdminOnly?: boolean;
  isSystemOnly?: boolean;
  isPersonal?: boolean;
  description?: string;
}

export interface ApiPermissionRule {
  method: string;
  path: string;
  permissions: Permission[];
  mode: "any" | "all";
}

export interface RolePermissionToggle {
  roleId: string;
  roleSlug: RoleSlug;
  roleName: string;
  permissionId: string;
  permissionKey: Permission;
  enabled: boolean;
}
