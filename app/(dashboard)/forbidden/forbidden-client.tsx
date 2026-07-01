"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Lock,
  Mail,
  RefreshCw,
  Shield,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/roles";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSION_LABELS, type Permission } from "@/lib/rbac/permissions";
import type { RoleSlug } from "@/constants/role-slugs";

export function ForbiddenClient() {
  const searchParams = useSearchParams();
  const { user, refreshPermissions } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const moduleName = searchParams.get("module") ?? "Protected Module";
  const resourcePath = searchParams.get("path") ?? "";
  const permissionKeys = (searchParams.get("permission") ?? "").split(",").filter(Boolean);
  const permissionLabel = permissionKeys
    .map((k) => PERMISSION_LABELS[k as Permission] ?? k)
    .join(", ");

  useEffect(() => {
    fetch("/api/csrf", { credentials: "include" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!resourcePath) return;

    let cancelled = false;

    void (async () => {
      try {
        const pathOnly = resourcePath.split("?")[0];
        const result = await apiClient.get<{ allowed: boolean }>(
          `/api/auth/effective-access?path=${encodeURIComponent(pathOnly)}`
        );
        if (cancelled || !result.allowed) return;

        await refreshPermissions();
        if (!cancelled) {
          window.location.href = resourcePath;
        }
      } catch {
        // User stays on forbidden page; manual refresh remains available.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resourcePath, refreshPermissions]);

  async function handleRefreshAccess() {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      await refreshPermissions();
      if (resourcePath) {
        window.location.href = resourcePath;
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to refresh permissions. Try signing in again."
      );
    } finally {
      setRefreshing(false);
    }
  }

  const roleLabel = user?.role ? ROLE_LABELS[user.role as RoleSlug] ?? user.role : "Loading…";

  return (
    <div className="relative mx-auto flex max-w-2xl flex-col gap-6 px-4 py-16">
      <div className="enterprise-panel overflow-hidden">
        <div className="border-b border-border bg-destructive/5 px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">403 — Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access this module.
          </p>
        </div>

        <div className="space-y-4 p-6">
          <DetailRow icon={Shield} label="Module" value={moduleName} />
          <DetailRow icon={UserCheck} label="Your role" value={roleLabel} />
          <DetailRow
            icon={AlertTriangle}
            label="Required permission"
            value={permissionLabel || "Restricted access"}
          />
          <DetailRow
            icon={Lock}
            label="Access status"
            value={<Badge variant="danger">Denied</Badge>}
          />
          {resourcePath && (
            <DetailRow icon={Shield} label="Resource path" value={resourcePath} mono />
          )}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
            <p className="font-medium text-warning">Reason access was denied</p>
            <p className="mt-1 text-muted-foreground">
              Your current role does not include {permissionLabel || "the required permission"}{" "}
              needed to view {moduleName}. Access is enforced by enterprise RBAC policy. Contact your
              administrator if you believe you need access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <Button
            variant="secondary"
            onClick={handleRefreshAccess}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh Access"}
          </Button>
          <Button variant="outline" asChild>
            <a href="mailto:admin@ruggedmonitoring.com?subject=Access%20Request">
              <Mail className="mr-2 h-4 w-4" />
              Contact Administrator
            </a>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.ACCOUNT}>
              Account settings
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={ROUTES.DASHBOARD}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {errorMessage && (
          <div className="border-t border-border px-6 py-4 text-sm text-destructive">
            <p className="font-medium">Unable to refresh access</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Shield;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={mono ? "mt-0.5 truncate font-mono text-sm" : "mt-0.5 text-sm font-medium"}>
          {value}
        </p>
      </div>
    </div>
  );
}
