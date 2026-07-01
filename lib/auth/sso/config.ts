import type { SsoProviderSlug } from "@/constants/sso";
import { settingsRepository } from "@/repositories/settings.repository";

const DEFAULT_SSO_EMAIL_DOMAIN = "ruggedmonitoring.com";

export function getSsoAllowedEmailDomain(): string {
  const raw = process.env.SSO_ALLOWED_EMAIL_DOMAIN?.trim();
  return (raw || DEFAULT_SSO_EMAIL_DOMAIN).replace(/^@/, "").toLowerCase();
}

export function isEmailAllowedForSso(email: string): boolean {
  const domain = getSsoAllowedEmailDomain();
  return email.trim().toLowerCase().endsWith(`@${domain}`);
}

export interface ResolvedSsoConfig {
  provider: SsoProviderSlug;
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
  autoProvision: boolean;
}

function resolveIssuer(provider: SsoProviderSlug): string | undefined {
  if (process.env.SSO_ISSUER) return process.env.SSO_ISSUER;

  switch (provider) {
    case "azure_ad": {
      const tenantId = process.env.SSO_AZURE_TENANT_ID;
      return tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : undefined;
    }
    case "google":
      return "https://accounts.google.com";
    case "okta":
      return process.env.SSO_OKTA_ISSUER;
    default:
      return undefined;
  }
}

function isSsoProviderSlug(value: string): value is SsoProviderSlug {
  return value === "okta" || value === "azure_ad" || value === "google";
}

export function resolveConfiguredProvider(
  settingsProvider: string,
  runtimeProvider?: SsoProviderSlug
): SsoProviderSlug | null {
  if (runtimeProvider) return runtimeProvider;
  return isSsoProviderSlug(settingsProvider) ? settingsProvider : null;
}

export async function getSsoSettings() {
  try {
    const rows = await settingsRepository.getByKeys([
      "integrations.sso.enabled",
      "integrations.sso.provider",
      "integrations.sso.auto_provision",
    ]);
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return {
      enabled: map.get("integrations.sso.enabled") === "true",
      provider: map.get("integrations.sso.provider") ?? "none",
      autoProvision: map.get("integrations.sso.auto_provision") === "true",
    };
  } catch {
    return {
      enabled: false,
      provider: "none",
      autoProvision: false,
    };
  }
}

export async function resolveSsoConfig(): Promise<ResolvedSsoConfig | null> {
  const settings = await getSsoSettings();
  if (!settings.enabled || settings.provider === "none" || !isSsoProviderSlug(settings.provider)) {
    return null;
  }

  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;
  const issuer = resolveIssuer(settings.provider);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !issuer || !appUrl) {
    return null;
  }

  return {
    provider: settings.provider,
    clientId,
    clientSecret,
    issuer: issuer.replace(/\/$/, ""),
    redirectUri: `${appUrl.replace(/\/$/, "")}/api/auth/sso/callback`,
    autoProvision: settings.autoProvision,
  };
}
