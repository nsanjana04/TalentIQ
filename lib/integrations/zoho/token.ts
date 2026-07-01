import { AppError } from "@/lib/errors/app-error";
import { resolveZohoConfigFromEnv, type ResolvedZohoConfig } from "@/lib/integrations/zoho/config";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

type ZohoTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

export async function getZohoAccessToken(config?: ResolvedZohoConfig): Promise<string> {
  const resolved = config ?? resolveZohoConfigFromEnv();
  if (!resolved) {
    throw new AppError("BAD_REQUEST", "Zoho People is not configured");
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const params = new URLSearchParams({
    refresh_token: resolved.refreshToken,
    client_id: resolved.clientId,
    client_secret: resolved.clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(`${resolved.accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await response.json()) as ZohoTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new AppError(
      "BAD_REQUEST",
      data.error ?? "Failed to refresh Zoho access token. Check Zoho credentials."
    );
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}
