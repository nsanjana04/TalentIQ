import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { AppError } from "@/lib/errors/app-error";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { getSessionFromRequest } from "@/lib/auth/session";
import {
  CSRF_COOKIE,
  generateCsrfToken,
  getCsrfCookieOptions,
} from "@/lib/security/csrf";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    const context = {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    };

    if (refreshToken) {
      const result = await authService.refresh(refreshToken, context);
      await setAuthCookies(result.accessToken, result.refreshToken, result.rememberMe);

      const csrfToken = generateCsrfToken();
      const response = apiSuccess({ user: result.user });
      response.cookies.set(CSRF_COOKIE, csrfToken, getCsrfCookieOptions());
      return response;
    }

    const session = await getSessionFromRequest(request, { enrich: false });
    if (!session) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }

    const result = await authService.refreshPermissions(session.userId, context);
    const response = apiSuccess({ user: result.user });
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      result.accessToken,
      getAccessTokenCookieOptions()
    );
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
