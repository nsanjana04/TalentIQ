import type { RoleSlug } from "@/constants/role-slugs";
import type { DashboardScopeType } from "@/lib/dashboard/scope";
import type { Permission } from "@/lib/rbac/permissions";

export interface AuthUserScope {
  type: DashboardScopeType;
  label: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleSlug;
  roleId: string;
  permissions: Permission[];
  deniedPermissions?: Permission[];
  permissionVersion?: number;
  userPermissionVersion?: number;
  scope?: AuthUserScope;
  isActive: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface UserSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  rememberMe: boolean;
  isCurrent: boolean;
}
