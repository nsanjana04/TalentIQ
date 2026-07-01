import type { SsoProvider } from "@prisma/client";

export type SsoProviderSlug = "okta" | "azure_ad" | "google";

export const SSO_PROVIDER_LABELS: Record<SsoProviderSlug, string> = {
  okta: "Okta",
  azure_ad: "Microsoft",
  google: "Google",
};

export const SSO_PROVIDER_TO_ENUM: Record<SsoProviderSlug, SsoProvider> = {
  okta: "OKTA",
  azure_ad: "AZURE_AD",
  google: "GOOGLE",
};

export const SSO_ENUM_TO_SLUG: Record<SsoProvider, SsoProviderSlug> = {
  OKTA: "okta",
  AZURE_AD: "azure_ad",
  GOOGLE: "google",
};

export const SSO_STATE_COOKIE = "talentiq_sso_state";
export const SSO_SCOPES = "openid email profile";
