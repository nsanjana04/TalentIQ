import { NextRequest, NextResponse } from "next/server";
import type { RoleSlug } from "@/constants/role-slugs";
import type { AuthSession } from "@/lib/auth/session";
import { getSessionFromRequest } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { handleApiError, apiSuccess, type ApiSuccessResponse } from "@/lib/errors/api-error";
import { Permission } from "@/lib/rbac/permissions";
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
} from "@/lib/rbac/guard";
import { apiPermissionResolver } from "@/lib/rbac/resolvers/api-resolver";
import { auditService } from "@/services/audit.service";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { LEARNING_MANAGER_ROLES } from "@/constants/learning-manager-roles";

type AuthenticatedHandler<T> = (
  request: NextRequest,
  session: AuthSession
) => Promise<NextResponse<ApiSuccessResponse<T>>>;

async function logPermissionDenied(
  session: AuthSession,
  request: NextRequest,
  missing?: Permission[]
) {
  await auditService.log({
    action: "PERMISSION_DENIED",
    entityType: "ApiRoute",
    entityId: request.nextUrl.pathname,
    actorId: session.userId,
    metadata: { method: request.method, missing },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
}

export function withAuth<T>(handler: AuthenticatedHandler<T>) {
  return async (request: NextRequest) => {
    try {
      const session = await getSessionFromRequest(request);
      if (!session) {
        throw new AppError("UNAUTHORIZED", "Authentication required");
      }

      const apiCheck = apiPermissionResolver.resolve(
        request.method,
        request.nextUrl.pathname,
        session.permissions
      );

      if (!apiCheck.allowed) {
        await logPermissionDenied(session, request, apiCheck.missing);
        throw new AppError("FORBIDDEN", "Insufficient permissions");
      }

      return await handler(request, session);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withPermission<T>(
  permission: Permission,
  handler: AuthenticatedHandler<T>
) {
  return withAuth<T>(async (request, session) => {
    try {
      requirePermission(session, permission);
    } catch (error) {
      if (error instanceof AppError && error.code === "FORBIDDEN") {
        await logPermissionDenied(session, request, [permission]);
      }
      throw error;
    }
    return handler(request, session);
  });
}

export function withAnyPermission<T>(
  permissions: Permission[],
  handler: AuthenticatedHandler<T>
) {
  return withAuth<T>(async (request, session) => {
    requireAnyPermission(session, permissions);
    return handler(request, session);
  });
}

export function withAllPermissions<T>(
  permissions: Permission[],
  handler: AuthenticatedHandler<T>
) {
  return withAuth<T>(async (request, session) => {
    requireAllPermissions(session, permissions);
    return handler(request, session);
  });
}

export function withRole<T>(
  roles: RoleSlug[],
  handler: AuthenticatedHandler<T>
) {
  return withAuth<T>(async (request, session) => {
    requireRole(session, roles);
    return handler(request, session);
  });
}

export function withLearningManager<T>(handler: AuthenticatedHandler<T>) {
  return withAuth<T>(async (request, session) => {
    try {
      requirePermission(session, Permission.COURSES_MANAGE);
      requireRole(session, LEARNING_MANAGER_ROLES);
    } catch (error) {
      if (error instanceof AppError && error.code === "FORBIDDEN") {
        await logPermissionDenied(session, request, [Permission.COURSES_MANAGE]);
      }
      throw error;
    }
    return handler(request, session);
  });
}

/** Resource Library is managed by system admins only. */
export function withResourceLibraryAdmin<T>(handler: AuthenticatedHandler<T>) {
  return withAuth<T>(async (request, session) => {
    try {
      requirePermission(session, Permission.COURSES_MANAGE);
      requireRole(session, ["ADMIN"]);
    } catch (error) {
      if (error instanceof AppError && error.code === "FORBIDDEN") {
        await logPermissionDenied(session, request, [Permission.COURSES_MANAGE]);
      }
      throw error;
    }
    return handler(request, session);
  });
}

export { apiSuccess };
