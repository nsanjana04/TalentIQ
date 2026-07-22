"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { userScopedKey } from "@/lib/auth/query-keys";
import { useResolvedNavigation } from "@/hooks/useResolvedNavigation";

const NAV_BADGES_KEY = ["navigation", "badges"] as const;

export function useNavBadges() {
  const { flatItems } = useResolvedNavigation();
  const { user } = useAuth();
  const visibleIds = flatItems.map((item) => item.id).join(",");

  return useQuery({
    queryKey: userScopedKey(NAV_BADGES_KEY, user?.id, user?.role).concat(visibleIds),
    queryFn: () =>
      apiClient.get<{ badges: Record<string, number> }>(
        `/api/navigation/badges?items=${encodeURIComponent(visibleIds)}`
      ),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.id && flatItems.length > 0,
  });
}
