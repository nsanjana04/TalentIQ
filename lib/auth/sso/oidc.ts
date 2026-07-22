import { createRemoteJWKSet, jwtVerify } from "jose";
import { SSO_SCOPES } from "@/constants/sso";
import type { SsoOidcClaims } from "@/types/sso";
import { getSsoAllowedEmailDomain, type ResolvedSsoConfig } from "./config";

interface OidcDiscoveryDocument {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  issuer: string;
}

const discoveryCache = new Map<string, { doc: OidcDiscoveryDocument; expiresAt: number }>();

async function getDiscoveryDocument(issuer: string): Promise<OidcDiscoveryDocument> {
  const cached = discoveryCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.doc;
  }

  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to load OIDC discovery document (${response.status})`);
  }

  const doc = (await response.json()) as OidcDiscoveryDocument;
  discoveryCache.set(issuer, { doc, expiresAt: Date.now() + 60 * 60 * 1000 });
  return doc;
}

export async function buildAuthorizationUrl(
  config: ResolvedSsoConfig,
  params: { state: string; codeChallenge: string }
) {
  const discovery = await getDiscoveryDocument(config.issuer);
  const url = new URL(discovery.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SSO_SCOPES);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  if (config.provider === "azure_ad") {
    url.searchParams.set("domain_hint", getSsoAllowedEmailDomain());
  }
  return url.toString();
}

interface TokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
}

export async function exchangeAuthorizationCode(
  config: ResolvedSsoConfig,
  params: { code: string; codeVerifier: string }
) {
  const discovery = await getDiscoveryDocument(config.issuer);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    redirect_uri: config.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(discovery.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`OIDC token exchange failed (${response.status})`);
  }

  const tokens = (await response.json()) as TokenResponse;
  if (!tokens.id_token) {
    throw new Error("OIDC token response missing id_token");
  }

  return verifyIdToken(config, tokens.id_token, discovery.jwks_uri);
}

async function verifyIdToken(
  config: ResolvedSsoConfig,
  idToken: string,
  jwksUri: string
): Promise<SsoOidcClaims> {
  const jwks = createRemoteJWKSet(new URL(jwksUri));
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: config.issuer,
    audience: config.clientId,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : null;
  const email =
    (typeof payload.email === "string" && payload.email) ||
    (typeof payload.preferred_username === "string" && payload.preferred_username) ||
    (typeof payload.upn === "string" && payload.upn) ||
    null;

  if (!sub || !email) {
    throw new Error("OIDC id_token missing required claims");
  }

  const givenName =
    (typeof payload.given_name === "string" && payload.given_name) ||
    (typeof payload.name === "string" && payload.name.split(" ")[0]) ||
    email.split("@")[0];
  const familyName =
    (typeof payload.family_name === "string" && payload.family_name) ||
    (typeof payload.name === "string" && payload.name.split(" ").slice(1).join(" ")) ||
    "User";

  return {
    sub,
    email: email.toLowerCase(),
    firstName: givenName,
    lastName: familyName || "User",
    emailVerified:
      payload.email_verified === true ||
      payload.email_verified === "true" ||
      config.provider === "azure_ad",
  };
}
