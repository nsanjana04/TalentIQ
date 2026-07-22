import { generateCsrfToken, getCsrfCookieOptions, CSRF_COOKIE } from "@/lib/security/csrf";
import { apiSuccess } from "@/lib/errors/api-error";

export async function GET() {
  const token = generateCsrfToken();
  const response = apiSuccess({ token });
  response.cookies.set(CSRF_COOKIE, token, getCsrfCookieOptions());
  return response;
}
