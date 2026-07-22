"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permissions";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { Permission } from "@/lib/rbac/permissions";
import { ROUTES } from "@/constants/routes";
import { canAny } from "@/lib/rbac/check";
import { ApiErrorState } from "@/components/feedback/api-error-state";

type CountKey = "users" | "organization" | "audit";

const ADMIN_LINKS: {
  href: string;
  title: string;
  description: string;
  permissions: Permission[];
  countKey?: CountKey;
}[] = [
  {
    href: ROUTES.ADMIN_ROLES,
    title: "Roles & Permissions",
    description: "Manage role permission matrix",
    permissions: [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE, Permission.PERMISSIONS_MANAGE],
  },
  {
    href: `${ROUTES.SETTINGS}?tab=audit`,
    title: "Audit Logs",
    description: "Platform action history",
    permissions: [Permission.AUDITLOGS_VIEW],
    countKey: "audit",
  },
  {
    href: ROUTES.SETTINGS,
    title: "System Settings",
    description: "Platform configuration",
    permissions: [Permission.SETTINGS_VIEW, Permission.SETTINGS_MANAGE],
  },
];

function linkCount(key: CountKey, overview: NonNullable<ReturnType<typeof useAdminOverview>["data"]>): string {
  switch (key) {
    case "users":
      return `${overview.users.active} active / ${overview.users.total} total`;
    case "organization":
      return `${overview.organization.departments} depts · ${overview.organization.teams} teams`;
    case "audit":
      return `${overview.audit.last7Days} events (7d)`;
    default:
      return "";
  }
}

export default function AdminPage() {
  const { permissions } = usePermissions();
  const { data: overview, isLoading, isError, error, refetch, isFetching } = useAdminOverview();
  const visibleLinks = ADMIN_LINKS.filter((link) => canAny(permissions, [...link.permissions]));

  if (visibleLinks.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have access to administration modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="mt-2 text-muted-foreground">Platform management and configuration.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading live platform metrics…
        </div>
      ) : isError ? (
        <ApiErrorState
          compact
          error={error}
          title="Could not load admin metrics"
          action="Load admin overview"
          resource="/api/admin/overview"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : overview ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Users" value={`${overview.users.active}`} sub={`${overview.users.total} total`} />
          <MetricCard
            label="Courses"
            value={`${overview.courses.published}`}
            sub={`${overview.courses.completionRate}% completion · ${overview.courses.inProgress} in progress`}
          />
          <MetricCard
            label="Certificates"
            value={`${overview.certificates.active}`}
            sub={`${overview.certificates.total} issued total`}
          />
          <MetricCard
            label="Audit Events"
            value={`${overview.audit.last7Days}`}
            sub="Last 7 days"
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
                {overview && link.countKey && (
                  <p className="text-xs font-medium text-primary">
                    {linkCount(link.countKey, overview)}
                  </p>
                )}
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

