"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { getSsoErrorMessage, SsoSignInSection } from "@/components/auth/sso-sign-in-section";
import { useAuth } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { apiClient } from "@/lib/api-client";
import { isPrivilegedEmergencyRole, resolvePostLoginFallbackPath } from "@/lib/screens/emergency-screen-access";
import type { SidebarApiResponse } from "@/hooks/useResolvedNavigation";
import type { SsoPublicConfig } from "@/types/sso";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? ROUTES.DASHBOARD;
  const verified = searchParams.get("verified");
  const ssoError = getSsoErrorMessage(searchParams.get("error"));
  const { login, isLoggingIn, loginError, refetchUser } = useAuth();

  const { data: ssoConfig, isLoading: ssoConfigLoading, isError: ssoConfigError } = useQuery({
    queryKey: ["auth", "sso", "config"],
    queryFn: () => apiClient.get<SsoPublicConfig>("/api/auth/sso/config"),
    staleTime: 60_000,
    retry: false,
  });

  const ssoOnly = Boolean(ssoConfig?.enabled);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await login({ email, password, rememberMe });
      const authUser = await refetchUser();
      const role = authUser?.role ?? result.user.role;

      let destination = redirect;
      try {
        const sidebar = await apiClient.get<SidebarApiResponse>("/api/navigation/sidebar");
        const firstVisible = sidebar.sections.flatMap((section) => section.items)[0]?.route;
        if (firstVisible) {
          const target = redirect.split("?")[0].replace(/\/$/, "") || "/";
          const allowed = sidebar.sections
            .flatMap((section) => section.items)
            .some((item) => {
              const route = item.route.split("?")[0].replace(/\/$/, "") || "/";
              return route === target || target.startsWith(`${route}/`);
            });
          destination = allowed ? redirect : firstVisible;
        } else if (isPrivilegedEmergencyRole(role)) {
          destination = ROUTES.DASHBOARD;
        } else {
          destination = resolvePostLoginFallbackPath(role);
        }
      } catch {
        destination = isPrivilegedEmergencyRole(role)
          ? ROUTES.DASHBOARD
          : resolvePostLoginFallbackPath(role);
      }

      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  if (ssoConfigLoading && !ssoConfigError) {
    return (
      <AuthFormLayout title="Sign in" description="Loading sign-in options...">
        <p className="text-center text-sm text-muted-foreground">Please wait...</p>
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout
      title={ssoOnly ? "Sign in with Microsoft" : "Sign in"}
      description={
        ssoOnly
          ? "Use your @ruggedmonitoring.com work account to access TalentIQ"
          : "Access your workforce intelligence platform"
      }
    >
      {verified && !ssoOnly && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
          Email verified successfully. You can now sign in.
        </p>
      )}
      {ssoError && (
        <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {ssoError}
        </p>
      )}
      <SsoSignInSection redirect={redirect} autoRedirect={ssoOnly} ssoOnly={ssoOnly} />
      {!ssoOnly && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Remember me for 30 days
          </label>
          {(error || loginError) && (
            <p className="text-sm text-destructive">
              {error ?? (loginError instanceof Error ? loginError.message : "Login failed")}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      )}
    </AuthFormLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
