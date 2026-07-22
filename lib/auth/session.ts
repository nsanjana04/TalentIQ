import { headers } from "next/headers";
import type { RoleSlug } from "@/constants/role-slugs";
import { AppError } from "@/lib/errors/app-error";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { isValidPermission, type Permission } from "@/lib/rbac/permissions";
import { getEffectiveAccess } from "@/lib/rbac/get-effective-access";
import { verifyAccessToken } from "./jwt";
import { getAccessTokenFromCookies } from "./cookies";

export interface AuthSession {
  userId: string;
  email: string;
  role: RoleSlug;
  roleId: string;
  permissions: Permission[];
}

function parsePermissionsFromPayload(
  permissions: unknown,
  role: RoleSlug
): Permission[] {
  if (Array.isArray(permissions)) {
    const parsed = permissions.filter(isValidPermission);
    if (parsed.length > 0) return parsed;
  }
  return getDefaultPermissionsForRole(role);
}

async function enrichSessionFromDb(
  base: Omit<AuthSession, "permissions" | "roleId"> & { roleId?: string }
): Promise<AuthSession> {
  try {
    const access = await getEffectiveAccess(base.userId);
    return {
      userId: base.userId,
      email: base.email,
      role: access.role,
      roleId: access.roleId,
      permissions: access.permissions,
    };
  } catch {
    return {
      userId: base.userId,
      email: base.email,
      role: base.role,
      roleId: base.roleId ?? "",
      permissions: getDefaultPermissionsForRole(base.role),
    };
  }
}

function payloadToSession(payload: {
  sub: string;
  email: string;
  role: RoleSlug;
  permissions?: unknown;
}): AuthSession {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    roleId: "",
    permissions: parsePermissionsFromPayload(payload.permissions, payload.role),
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    return payloadToSession(payload);
  } catch {
    return null;
  }
}

export async function getEnrichedSession(): Promise<AuthSession | null> {
  const session = await getSession();
  if (!session) return null;
  return enrichSessionFromDb(session);
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getEnrichedSession();
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Authentication required");
  }
  return session;
}

export function getTokenFromHeader(request: Request): string | undefined {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  return authHeader.slice(7);
}

export async function getSessionFromRequest(
  request: Request,
  options?: { enrich?: boolean }
): Promise<AuthSession | null> {
  const enrich = options?.enrich ?? true;
  const bearerToken = getTokenFromHeader(request);

  let session: AuthSession | null = null;

  if (bearerToken) {
    try {
      const payload = await verifyAccessToken(bearerToken);
      session = payloadToSession(payload);
    } catch {
      return null;
    }
  } else {
    session = await getSession();
  }

  if (!session) return null;
  return enrich ? enrichSessionFromDb(session) : session;
}

export async function getRequestMetadata(): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0]?.trim()
    : headersList.get("x-real-ip") ?? undefined;

  return {
    ipAddress,
    userAgent: headersList.get("user-agent") ?? undefined,
  };
}
