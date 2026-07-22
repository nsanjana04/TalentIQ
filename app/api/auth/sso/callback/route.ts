import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import {
  setAuthCookiesOnResponse,
} from "@/lib/auth/cookies";
import { AppError } from "@/lib/errors/app-error";
import {
  clearSsoStateCookieOnResponse,
  readSsoStateCookie,
} from "@/lib/auth/sso/state-cookie";
import { getClientIp, getUserAgent } from "@/lib/utils";
import {
  CSRF_COOKIE,
  generateCsrfToken,
  getCsrfCookieOptions,
} from "@/lib/security/csrf";
import { ssoService } from "@/services/sso.service";

function loginRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=${error}`, request.url));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const error = params.get("error");
  const code = params.get("code");
  const state = params.get("state");

  if (error) {
    return loginRedirect(request, error === "access_denied" ? "sso_denied" : "sso_failed");
  }

  if (!code || !state) {
    return loginRedirect(request, "sso_failed");
  }

  const storedState = await readSsoStateCookie();
  if (!storedState) {
    return loginRedirect(request, "sso_failed");
  }

  try {
    const result = await ssoService.completeLogin(
      { code, state, storedState },
      { ipAddress: getClientIp(request), userAgent: getUserAgent(request) }
    );

    const { resolvePostLoginRedirect } = await import("@/lib/auth/post-login-redirect");
    const redirectTarget = await resolvePostLoginRedirect(
      result.user.id,
      result.user.role,
      storedState.redirect
    );
    const response = NextResponse.redirect(new URL(redirectTarget, request.url));
    setAuthCookiesOnResponse(
      response,
      result.accessToken,
      result.refreshToken,
      result.rememberMe
    );

    const csrfToken = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE, csrfToken, getCsrfCookieOptions());
    clearSsoStateCookieOnResponse(response);
    return response;
  } catch (err) {
    let errorCode = "sso_failed";
    if (err instanceof AppError) {
      if (err.code === "FORBIDDEN") {
        const reason =
          err.details &&
          typeof err.details === "object" &&
          "reason" in err.details &&
          (err.details as { reason?: string }).reason;
        errorCode =
          reason === "domain_not_allowed" ? "sso_domain_not_allowed" : "sso_account_not_found";
      }
    }
    const response = loginRedirect(request, errorCode);
    clearSsoStateCookieOnResponse(response);
    return response;
  }
}
