import { cookies } from "next/headers";
import { getRefreshCookieMaxAge } from "./remember-me";

export const ACCESS_TOKEN_COOKIE = "talentiq_access_token";
export const REFRESH_TOKEN_COOKIE = "talentiq_refresh_token";

const isProduction = process.env.NODE_ENV === "production";

export function getAccessTokenCookieOptions(maxAge = 60 * 15) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function getRefreshTokenCookieOptions(rememberMe = false) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: getRefreshCookieMaxAge(rememberMe),
  };
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe = false
) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(rememberMe)
  );
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export function setAuthCookiesOnResponse(
  response: import("next/server").NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe = false
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(rememberMe)
  );
}

export async function getAccessTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}
