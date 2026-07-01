import {
  SSO_ENUM_TO_SLUG,
  SSO_PROVIDER_LABELS,
  SSO_PROVIDER_TO_ENUM,
  type SsoProviderSlug,
} from "@/constants/sso";
import { AppError } from "@/lib/errors/app-error";
import { buildAuthorizationUrl, exchangeAuthorizationCode } from "@/lib/auth/sso/oidc";
import { generatePkcePair } from "@/lib/auth/sso/pkce";
import {
  getSsoAllowedEmailDomain,
  getSsoSettings,
  isEmailAllowedForSso,
  resolveConfiguredProvider,
  resolveSsoConfig,
} from "@/lib/auth/sso/config";
import { createSsoState } from "@/lib/auth/sso/state-cookie";
import { prisma } from "@/lib/db/prisma";
import { userIdentityRepository } from "@/repositories/user-identity.repository";
import { userRepository } from "@/repositories/user.repository";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import type { SsoOidcClaims, SsoPublicConfig } from "@/types/sso";

export const ssoService = {
  async getPublicConfig(): Promise<SsoPublicConfig> {
    const settings = await getSsoSettings();
    const runtimeConfig = await resolveSsoConfig();
    const emptyConfig: SsoPublicConfig = {
      enabled: false,
      configured: false,
      provider: null,
      providerLabel: null,
      allowedEmailDomain: null,
    };

    if (!settings.enabled) {
      return emptyConfig;
    }

    const provider = resolveConfiguredProvider(settings.provider, runtimeConfig?.provider ?? undefined);
    if (!provider) {
      return { ...emptyConfig, enabled: true, configured: false };
    }

    return {
      enabled: true,
      configured: Boolean(runtimeConfig),
      provider,
      providerLabel: SSO_PROVIDER_LABELS[provider],
      allowedEmailDomain: getSsoAllowedEmailDomain(),
    };
  },

  async getAuthorizationRedirect(redirectPath: string) {
    const config = await resolveSsoConfig();
    if (!config) {
      throw new AppError("BAD_REQUEST", "SSO is not enabled or configured");
    }

    const { codeVerifier, codeChallenge } = generatePkcePair();
    const statePayload = createSsoState({
      codeVerifier,
      redirect: redirectPath,
      provider: config.provider,
    });

    const authorizationUrl = await buildAuthorizationUrl(config, {
      state: statePayload.state,
      codeChallenge,
    });

    return { authorizationUrl, statePayload };
  },

  async completeLogin(
    params: {
      code: string;
      state: string;
      storedState: { state: string; codeVerifier: string; provider: SsoProviderSlug };
    },
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    if (params.state !== params.storedState.state) {
      throw new AppError("BAD_REQUEST", "Invalid SSO state");
    }

    const config = await resolveSsoConfig();
    if (!config || config.provider !== params.storedState.provider) {
      throw new AppError("BAD_REQUEST", "SSO configuration mismatch");
    }

    const claims = await exchangeAuthorizationCode(config, {
      code: params.code,
      codeVerifier: params.storedState.codeVerifier,
    });

    if (!isEmailAllowedForSso(claims.email)) {
      const domain = getSsoAllowedEmailDomain();
      await auditService.log({
        action: "LOGIN_FAILED",
        entityType: "User",
        metadata: { email: claims.email, method: "sso", reason: "domain_not_allowed" },
      });
      throw new AppError("FORBIDDEN", `Only @${domain} accounts can sign in.`, {
        details: { reason: "domain_not_allowed" },
      });
    }

    const user = await this.resolveUser(config.provider, claims, config.autoProvision);
    if (!user) {
      throw new AppError(
        "FORBIDDEN",
        "No matching account found. Contact your administrator to be provisioned."
      );
    }

    return authService.establishSession(user, {
      rememberMe: false,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      metadata: { method: "sso", provider: config.provider },
    });
  },

  async resolveUser(
    providerSlug: SsoProviderSlug,
    claims: SsoOidcClaims,
    autoProvision: boolean
  ) {
    const provider = SSO_PROVIDER_TO_ENUM[providerSlug];

    const linked = await userIdentityRepository.findByProviderAndExternalId(provider, claims.sub);
    if (linked?.user.isActive) {
      return linked.user;
    }

    const existingUser = await userRepository.findByEmail(claims.email);
    if (existingUser?.isActive) {
      const identity = await userIdentityRepository.findByUserAndProvider(existingUser.id, provider);
      if (!identity) {
        await userIdentityRepository.linkIdentity(existingUser.id, provider, claims.sub);
      }
      if (claims.emailVerified && !existingUser.emailVerifiedAt) {
        await userRepository.verifyEmail(existingUser.id);
      }
      return userRepository.findByIdWithRole(existingUser.id);
    }

    if (!autoProvision) {
      await auditService.log({
        action: "LOGIN_FAILED",
        entityType: "User",
        metadata: { email: claims.email, method: "sso", reason: "account_not_found" },
      });
      return null;
    }

    const employeeRole = await prisma.role.findUnique({ where: { slug: "EMPLOYEE" } });
    if (!employeeRole) {
      throw new AppError("INTERNAL_ERROR", "Default employee role not configured");
    }

    const created = await prisma.user.create({
      data: {
        email: claims.email,
        firstName: claims.firstName,
        lastName: claims.lastName,
        roleId: employeeRole.id,
        emailVerifiedAt: claims.emailVerified ? new Date() : null,
        identities: {
          create: {
            provider,
            externalId: claims.sub,
          },
        },
      },
      include: { role: true },
    });

    await auditService.log({
      action: "CREATE",
      entityType: "User",
      entityId: created.id,
      metadata: { method: "sso", provider: SSO_ENUM_TO_SLUG[provider] },
    });

    return created;
  },
};
