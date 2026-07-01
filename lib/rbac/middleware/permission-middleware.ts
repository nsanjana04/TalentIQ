import { NextResponse, type NextRequest } from "next/server";
import type { RoleSlug } from "@/constants/role-slugs";
import type { Permission } from "@/lib/rbac/permissions";
import { PROTECTED_ROUTE_PREFIXES, ROUTES } from "@/constants/routes";
import { isPrivilegedEmergencyRole } from "@/lib/screens/emergency-screen-access";
import { canAny, canAll } from "@/lib/rbac/check";
import { getRoutePermissionRule, getModuleForPath } from "@/lib/rbac/routePermissions";
import { getModuleLabel } from "@/lib/rbac/permissionLabels";
import { apiPermissionResolver } from "@/lib/rbac/resolvers/api-resolver";

export interface MiddlewareAuthContext {
  isAuthenticated: boolean;
  role?: string;
  permissions: Permission[];
}

export function checkPagePermission(
  pathname: string,
  context: MiddlewareAuthContext,
  baseUrl?: string
): NextResponse | null {
  const normalized = pathname.split("?")[0].replace(/\/$/, "") || "/";

  if (
    normalized === ROUTES.ACCOUNT ||
    normalized.startsWith(`${ROUTES.ACCOUNT}/`)
  ) {
    return context.isAuthenticated ? null : NextResponse.redirect(new URL(ROUTES.LOGIN, baseUrl ?? "http://localhost"));
  }

  if (
    isPrivilegedEmergencyRole(context.role) &&
    (normalized === ROUTES.DASHBOARD || normalized.startsWith(`${ROUTES.DASHBOARD}/`))
  ) {
    return context.isAuthenticated ? null : NextResponse.redirect(new URL(ROUTES.LOGIN, baseUrl ?? "http://localhost"));
  }

  const rule = getRoutePermissionRule(pathname);
  if (!rule) return null;

  if (rule.accessType === "authenticated" || rule.permissions.length === 0) {
    return context.isAuthenticated ? null : NextResponse.redirect(new URL(ROUTES.LOGIN, baseUrl ?? "http://localhost"));
  }

  const hasAccess =
    rule.mode === "all"
      ? canAll(context.permissions, rule.permissions)
      : canAny(context.permissions, rule.permissions);

  if (hasAccess) return null;

  const forbiddenUrl = new URL(ROUTES.FORBIDDEN, baseUrl ?? "http://localhost");
  forbiddenUrl.searchParams.set("path", pathname);
  if (rule.permissions.length) {
    forbiddenUrl.searchParams.set("permission", rule.permissions.join(","));
  }
  const moduleKey = rule.module ?? getModuleForPath(pathname);
  forbiddenUrl.searchParams.set("module", getModuleLabel(moduleKey));
  if (context.role) {
    forbiddenUrl.searchParams.set("role", context.role);
  }
  return NextResponse.redirect(forbiddenUrl);
}

export function checkApiPermission(
  request: NextRequest,
  context: MiddlewareAuthContext
): NextResponse | null {
  const { pathname } = request.nextUrl;
  const result = apiPermissionResolver.resolve(
    request.method,
    pathname,
    context.permissions
  );

  if (result.allowed) return null;

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
        requiredPermission: result.missing?.[0],
        module: result.rule?.path,
        details: { missing: result.missing, rule: result.rule },
      },
    },
    { status: 403 }
  );
}

export function isProtectedPage(pathname: string): boolean {
  const pagePrefixes = PROTECTED_ROUTE_PREFIXES.filter((prefix) => prefix !== "/api");
  return (
    pagePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) || pathname === ROUTES.FORBIDDEN
  );
}

export function requiresPermissionCheck(pathname: string): boolean {
  return (
    isProtectedPage(pathname) ||
    pathname.startsWith("/admin") ||
    getRoutePermissionRule(pathname) !== undefined
  );
}
