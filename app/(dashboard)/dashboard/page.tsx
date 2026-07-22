"use client";

import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { ApiErrorState } from "@/components/feedback/api-error-state";
import {
  PersonalDashboard,
  ManagerDashboard,
  ExecutiveDashboard,
  resolveDashboardVariant,
} from "@/components/dashboard/dashboard-views";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

  if (!user) return <DashboardSkeleton />;

  if (isError || (!isLoading && !data)) {
    return (
      <DashboardPageShell className="flex min-h-[50vh] items-center justify-center">
        <ApiErrorState
          error={isError ? error : new Error("Dashboard data is unavailable.")}
          title="Unable to load command center"
          action="Load dashboard"
          resource="/api/dashboard"
          onRetry={() => refetch()}
          isRetrying={isFetching}
          className="mx-auto w-full max-w-lg"
        />
      </DashboardPageShell>
    );
  }

  if (isLoading || !data) return <DashboardSkeleton />;

  const variant = resolveDashboardVariant(user.role);
  const props = { user, data, isFetching, onRefresh: () => refetch() };

  switch (variant) {
    case "personal":
      return <PersonalDashboard {...props} />;
    case "manager":
      return <ManagerDashboard {...props} />;
    case "executive":
    default:
      return <ExecutiveDashboard {...props} />;
  }
}
