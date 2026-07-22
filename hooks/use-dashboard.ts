"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { dashboardOverviewQueryKey } from "@/lib/auth/query-keys";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardOverview } from "@/types/dashboard";

export function useDashboard(options?: { enabled?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const queryKey = dashboardOverviewQueryKey(user?.id, user?.role);

  const query = useQuery({
    queryKey,
    queryFn: () => apiClient.get<DashboardOverview>("/api/dashboard/overview"),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled: (options?.enabled !== false) && isAuthenticated && !!user?.id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
