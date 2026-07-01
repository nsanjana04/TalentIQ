import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "@/lib/rbac/permissions";

export interface RoleDefinition {
  role: RoleSlug;
  label: string;
  description: string;
  permissions: Permission[];
}

export interface PermissionCheck {
  permission: Permission;
  granted: boolean;
}
