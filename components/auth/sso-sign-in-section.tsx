"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import type { SsoPublicConfig } from "@/types/sso";

const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_disabled: "Single sign-on is not enabled. Contact your administrator.",
  sso_denied: "Sign-in was cancelled at Microsoft.",
  sso_failed: "Microsoft sign-in failed. Please try again.",
  sso_account_not_found:
    "No matching account was found for your organization. Contact your administrator.",
  sso_domain_not_allowed: "Only @ruggedmonitoring.com Microsoft accounts can sign in.",
};

export function getSsoErrorMessage(code: string | null) {
  if (!code) return null;
  return SSO_ERROR_MESSAGES[code] ?? SSO_ERROR_MESSAGES.sso_failed;
}

interface SsoSignInSectionProps {
  redirect: string;
  autoRedirect?: boolean;
  ssoOnly?: boolean;
}

export function SsoSignInSection({
  redirect,
  autoRedirect = false,
  ssoOnly = false,
}: SsoSignInSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "sso", "config"],
    queryFn: () => apiClient.get<SsoPublicConfig>("/api/auth/sso/config"),
    staleTime: 60_000,
  });

  const startUrl = `/api/auth/sso?redirect=${encodeURIComponent(redirect)}`;

  useEffect(() => {
    if (autoRedirect && data?.enabled && data.configured && data.providerLabel) {
      window.location.href = startUrl;
    }
  }, [autoRedirect, data?.enabled, data?.configured, data?.providerLabel, startUrl]);

  if (isLoading || (autoRedirect && data?.enabled && data?.configured)) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">Redirecting to Microsoft sign-in...</p>
      </div>
    );
  }

  if (!data?.enabled || !data.providerLabel) {
    return null;
  }

  const domainHint = data.allowedEmailDomain ? `@${data.allowedEmailDomain}` : null;

  if (!data.configured) {
    return (
      <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        Microsoft sign-in is enabled but not configured yet. Ask your administrator to set{" "}
        <code className="text-xs">SSO_CLIENT_ID</code>, <code className="text-xs">SSO_CLIENT_SECRET</code>, and{" "}
        <code className="text-xs">SSO_AZURE_TENANT_ID</code>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {domainHint && (
        <p className="text-center text-sm text-muted-foreground">
          Use your {domainHint} work account
        </p>
      )}
      <Button
        type="button"
        variant={ssoOnly ? "default" : "outline"}
        className="w-full"
        onClick={() => {
          window.location.href = startUrl;
        }}
      >
        Sign in with {data.providerLabel}
      </Button>
      {!ssoOnly && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      )}
    </div>
  );
}
