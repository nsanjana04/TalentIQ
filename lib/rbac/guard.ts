import type { RoleSlug } from "@/constants/role-slugs";
import { AppError } from "@/lib/errors/app-error";
import type { AuthSession } from "@/lib/auth/session";
import { permissionEngine } from "./engine";
import type { Permission } from "./permissions";

export function requireRole(session: AuthSession, allowedRoles: RoleSlug[]): void {
  if (!allowedRoles.includes(session.role)) {
    throw new AppError("FORBIDDEN", "Insufficient role privileges");
  }
}

export function requirePermission(
  session: AuthSession,
  permission: Permission
): void {
  if (!permissionEngine.can(session.permissions, permission)) {
    throw new AppError("FORBIDDEN", `Missing permission: ${permission}`);
  }
}

export function requireAnyPermission(
  session: AuthSession,
  permissions: Permission[]
): void {
  if (!permissionEngine.canAny(session.permissions, permissions)) {
    throw new AppError("FORBIDDEN", "Missing required permissions");
  }
}

export function requireAllPermissions(
  session: AuthSession,
  permissions: Permission[]
): void {
  if (!permissionEngine.canAll(session.permissions, permissions)) {
    throw new AppError("FORBIDDEN", "Missing required permissions");
  }
}

export function withAuth<T extends AuthSession>(
  session: T | null
): asserts session is T {
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }
}
