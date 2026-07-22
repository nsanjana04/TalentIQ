import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { RoleSlug } from "@/constants/role-slugs";
import { isValidPermission, type Permission } from "@/lib/rbac/permissions";
import { getDefaultPermissionsForRole } from "@/lib/rbac/permission-matrix";
import { API_PUBLIC_ROUTES, AUTH_ROUTES as AUTH_PAGES, ROUTES } from "@/constants/routes";
import {
  isProtectedPage,
  type MiddlewareAuthContext,
} from "@/lib/rbac/middleware/permission-middleware";
import { roleMiddleware } from "@/lib/rbac/middleware/role-middleware";
import { applySecurityHeaders } from "@/lib/security/headers";
import { applyCorsHeaders, handleCors } from "@/lib/security/cors";
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  shouldValidateCsrf,
  verifyCsrfToken,
} from "@/lib/security/csrf";
import {
  checkRateLimitEdge,
  getClientRateLimitKey,
  isRateLimitEnabled,
  RATE_LIMITS,
} from "@/lib/security/rate-limit-edge";

const ACCESS_TOKEN_COOKIE = "talentiq_access_token";

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isPublicApiRoute(pathname: string): boolean {
  return API_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((route) => pathname === route);
}

function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/") && !isPublicApiRoute(pathname);
}

function parsePermissions(raw: unknown, role: RoleSlug): Permission[] {
  if (Array.isArray(raw)) {
    const parsed = raw.filter(isValidPermission);
    if (parsed.length > 0) return parsed;
  }
  return getDefaultPermissionsForRole(role);
}

async function getAuthContext(token: string | undefined): Promise<MiddlewareAuthContext> {
  if (!token) {
    return { isAuthenticated: false, permissions: [] };
  }

  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    if (payload.type !== "access") {
      return { isAuthenticated: false, permissions: [] };
    }

    const role = payload.role as RoleSlug;
    return {
      isAuthenticated: true,
      role,
      permissions: parsePermissions(payload.permissions, role),
    };
  } catch {
    return { isAuthenticated: false, permissions: [] };
  }
}

function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CORS preflight ──
  const corsPreflight = handleCors(request);
  if (corsPreflight) return applySecurityHeaders(corsPreflight);

  // ── Rate limiting (API routes) ──
  if (pathname.startsWith("/api/") && isRateLimitEnabled()) {
    const ip = getClientIp(request);
    const isAuthRoute = pathname.startsWith("/api/auth/");
    const preset = isAuthRoute ? RATE_LIMITS.auth : RATE_LIMITS.api;
    const rl = checkRateLimitEdge({
      key: getClientRateLimitKey(ip, isAuthRoute ? "auth" : "api"),
      ...preset,
    });
    if (!rl.allowed) return applySecurityHeaders(rateLimitResponse(rl.resetAt));
  }

  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const authContext = await getAuthContext(token);

  // ── CSRF (mutating API requests) ──
  if (shouldValidateCsrf(request.method, pathname)) {
    const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
    const headerToken = request.headers.get(CSRF_HEADER);
    if (!verifyCsrfToken(cookieToken, headerToken)) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Invalid or missing CSRF token" },
          },
          { status: 403 }
        )
      );
    }
  }

  // ── API: authentication ──
  if (isProtectedApiRoute(pathname) && !authContext.isAuthenticated) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      )
    );
  }

  // ── API: permission check ──
  // Deferred to route handlers — they resolve permissions via getEffectiveAccess (DB),
  // not the JWT snapshot. Middleware JWT permissions can lag behind screen overrides.

  // ── Pages: authentication ──
  if (isProtectedPage(pathname) && !authContext.isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Pages: role check ──
  if (authContext.isAuthenticated && authContext.role) {
    const roleDenied = roleMiddleware.check(pathname, authContext.role, request.url);
    if (roleDenied) return roleDenied;
  }

  // ── Pages: permission check ──
  // Deferred to ScreenRouteGuard + server handlers using getEffectiveAccess (DB).

  if (isAuthPage(pathname) && authContext.isAuthenticated) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
  }

  let response = NextResponse.next();
  response = applySecurityHeaders(response);
  response = applyCorsHeaders(request, response);

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("X-Request-Id", crypto.randomUUID());
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|csv)$).*)",
  ],
};
