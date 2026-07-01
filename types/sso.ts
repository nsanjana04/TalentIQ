import type { SsoProviderSlug } from "@/constants/sso";

export interface SsoPublicConfig {
  enabled: boolean;
  configured: boolean;
  provider: SsoProviderSlug | null;
  providerLabel: string | null;
  allowedEmailDomain: string | null;
}

export interface SsoOidcClaims {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}
