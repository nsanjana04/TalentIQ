import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import type { NextResponse } from "next/server";
import { SSO_STATE_COOKIE } from "@/constants/sso";
import type { SsoProviderSlug } from "@/constants/sso";

export interface SsoStatePayload {
  state: string;
  codeVerifier: string;
  redirect: string;
  provider: SsoProviderSlug;
}

const isProduction = process.env.NODE_ENV === "production";

function getStateCookieOptions(maxAge = 60 * 10) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function createSsoState(payload: Omit<SsoStatePayload, "state"> & { state?: string }) {
  return {
    state: payload.state ?? randomBytes(24).toString("hex"),
    codeVerifier: payload.codeVerifier,
    redirect: payload.redirect,
    provider: payload.provider,
  } satisfies SsoStatePayload;
}

export async function setSsoStateCookie(payload: SsoStatePayload) {
  const cookieStore = await cookies();
  cookieStore.set(SSO_STATE_COOKIE, JSON.stringify(payload), getStateCookieOptions());
}

export function setSsoStateCookieOnResponse(response: NextResponse, payload: SsoStatePayload) {
  response.cookies.set(SSO_STATE_COOKIE, JSON.stringify(payload), getStateCookieOptions());
}

export async function readSsoStateCookie(): Promise<SsoStatePayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SSO_STATE_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SsoStatePayload;
  } catch {
    return null;
  }
}

export async function clearSsoStateCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SSO_STATE_COOKIE);
}

export function clearSsoStateCookieOnResponse(response: NextResponse) {
  response.cookies.delete(SSO_STATE_COOKIE);
}
