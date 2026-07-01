import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import { setAuthCookies } from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/validations/auth";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { AppError } from "@/lib/errors/app-error";
import {
  assertNotRateLimited,
  getClientRateLimitKey,
  recordFailedAttempt,
  RATE_LIMITS,
} from "@/lib/security/rate-limit-server";
import {
  CSRF_COOKIE,
  generateCsrfToken,
  getCsrfCookieOptions,
} from "@/lib/security/csrf";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) ?? "unknown";
    const rateLimitKey = getClientRateLimitKey(ip, "login");
    const rateLimitConfig = { key: rateLimitKey, ...RATE_LIMITS.login };

    await assertNotRateLimited(rateLimitConfig);

    const body = await request.json();
    const credentials = loginSchema.parse(body);

    let result;
    try {
      result = await authService.login(credentials, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      });
    } catch (loginError) {
      if (loginError instanceof AppError && loginError.code === "UNAUTHORIZED") {
        await recordFailedAttempt(rateLimitConfig);
      }
      throw loginError;
    }

    await setAuthCookies(
      result.accessToken,
      result.refreshToken,
      result.rememberMe
    );

    const csrfToken = generateCsrfToken();
    const response = apiSuccess({ user: result.user, csrfToken });
    response.cookies.set(CSRF_COOKIE, csrfToken, getCsrfCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
