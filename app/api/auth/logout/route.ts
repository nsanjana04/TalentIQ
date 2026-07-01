import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getSessionFromRequest } from "@/lib/auth/session";
import { CSRF_COOKIE } from "@/lib/security/csrf";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("talentiq_refresh_token")?.value;
    const session = await getSessionFromRequest(request);

    await authService.logout(refreshToken, session?.userId, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = apiSuccess({ message: "Logged out successfully" });
    response.cookies.delete("talentiq_access_token");
    response.cookies.delete("talentiq_refresh_token");
    response.cookies.delete(CSRF_COOKIE);
    await clearAuthCookies();
    return response;
  } catch (error) {
    const response = handleApiError(error);
    response.cookies.delete("talentiq_access_token");
    response.cookies.delete("talentiq_refresh_token");
    response.cookies.delete(CSRF_COOKIE);
    await clearAuthCookies();
    return response;
  }
}
