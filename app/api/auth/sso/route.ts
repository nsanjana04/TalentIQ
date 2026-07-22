import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/constants/routes";
import { generatePkcePair } from "@/lib/auth/sso/pkce";
import { resolveSsoConfig } from "@/lib/auth/sso/config";
import { buildAuthorizationUrl } from "@/lib/auth/sso/oidc";
import { createSsoState, setSsoStateCookieOnResponse } from "@/lib/auth/sso/state-cookie";

function sanitizeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return ROUTES.DASHBOARD;
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const config = await resolveSsoConfig();
    if (!config) {
      return NextResponse.redirect(
        new URL(`${ROUTES.LOGIN}?error=sso_disabled`, request.url)
      );
    }

    const redirect = sanitizeRedirect(request.nextUrl.searchParams.get("redirect"));
    const { codeVerifier, codeChallenge } = generatePkcePair();
    const statePayload = createSsoState({
      codeVerifier,
      redirect,
      provider: config.provider,
    });

    const authorizationUrl = await buildAuthorizationUrl(config, {
      state: statePayload.state,
      codeChallenge,
    });

    const response = NextResponse.redirect(authorizationUrl);
    setSsoStateCookieOnResponse(response, statePayload);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`${ROUTES.LOGIN}?error=sso_failed`, request.url));
  }
}
